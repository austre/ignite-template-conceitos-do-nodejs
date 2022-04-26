const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const users = [];

//Middleware
function checksExistsUserAccount(request, response, next) {
  const { name, username } = request.headers
  const user = users.find((user) => user.username === username)

  if (!user) {
    return response.status(400).json({ error: "Usuário não existe!" })
  }

  request.user = user
  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body
  const userAlreadyExists = users.some((user) => user.username === username)

  if (userAlreadyExists) {
    return response.status(400).json({ error: "Usuário já existe!" })
  }

  const user = {
    id: uuidv4(),
    name: name,
    username: username,
    todos: []
  }

  users.push(user)

  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.status(200).send(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body

  const todoOperation = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todoOperation)

  return response.status(201).send(todoOperation)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body
  const { id } = request.params

  //O uso da referência user.todo faz com que as alterações seguintes reflitam diretamente no objeto da lista user.todo[]
  //Não há necessidade de remover o objeto da lista user.todo[] e inserir o novo
  const todo = user.todos.find(todo => todo.id === id)

  if (!todo) {
    return response.status(404).json({ error: "O todo informado não foi encontrado!" })
  }

  todo.title = title
  todo.deadline = new Date(deadline)

  return response.status(200).send(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params

  const todo = user.todos.find(todo => todo.id === id)

  if (!todo) {
    return response.status(404).json({ error: "O todo informado não foi encontrado!" })
  }

  todo.done = true

  return response.status(200).send(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  if (todoIndex === -1) {
    return response.status(404).json({ error: "O todo informado não foi encontrado!" })
  }

  user.todos.splice(todoIndex, 1)

  return response.status(204).json()
});

module.exports = app;