const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const fileupload = require('express-fileupload')
const fs = require('fs')

const Posts = require('./Posts.js')

var session = require('express-session')

mongoose.connect('mongodb+srv://root:Oy7dIibEmTGW90YZ@cluster0.0r39y.mongodb.net/turbocode?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('conectado com sucesso')
}).catch((err) => {
    console.log(err.message)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}))

app.use(session({ secret: 'sadfGHASFDayturwqe78125r34518764c587312sgh54287315gcf48', cookie: { maxAge: 60000 } }))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use('/public', express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, '/pages'))

app.get('/', (req, res) => {
    if (req.query.busca == null) {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria
                }
            })

            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria
                    }
                })
                res.render('home', { posts: posts, postsTop: postsTop })
            })

        })
    } else {
        Posts.find({ titulo: { $regex: req.query.busca, $options: "i" } }, (err, posts) => {
            res.render('busca', { posts: posts, contagem: posts.length });
        })
    }
})

app.get('/:slug', (req, res) => {
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, resposta) => {
        if (resposta != null) {
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria
                    }
                })
                res.render('single', { noticia: resposta, postsTop: postsTop });
            })
        } else {
            res.redirect('/')
        }
    })
})

var usuarios = [
    {
        login: 'admin',
        senha: 'admin'
    }
]

app.post('/admin/login', (req, res) => {
    usuarios.map((val) => {
        if (val.login == req.body.login && val.senha == req.body.senha) {
            req.session.login = "Logado"
        }
    })
    res.redirect('/admin/login')
})

app.get('/admin/login', (req, res) => {
    if (req.session.login == null) {
        res.render('admin-login')
    } else {
        Posts.find({}).sort({ 'views': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    id: val._id,
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria
                }
            })
            res.render('admin-painel', { posts: posts })
        })
    }
})

app.post('/admin/cadastro', (req, res) => {

    let formato = req.files.arquivo.name.split('.')
    var imagem = ""

    if (formato[formato.length - 1] == "jpg") {
        imagem = new Date().getTime() + '.jpg'
        req.files.arquivo.mv(__dirname + '/public/images/' + imagem)
    } else {
        fs.unlinkSync(req.files.arquivo.tempFilePath)
    }

    Posts.create({
        titulo: req.body.titulo_noticia,
        imagem: 'http://localhost:3000/public/images/' + imagem,
        categoria: 'Nenhuma',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: 'Diego',
        views: 0
    })
    res.redirect('/admin/login')
})

app.get('/admin/deletar/:id', (req, res) => {
    Posts.deleteOne({ _id: req.params.id }).then(function () {
        res.redirect('/admin/login')
    })
})

app.listen(3000, () => {
    console.log('server rodando!')
})
