const { v4 } = require("uuid");
const express = require("express");

const app = express();

app.use(express.json());

const customers = [];

function verifyIExistAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) return res.status(400).json({error: "customer not found"});

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, next) => {
        next.type === "credit" ? acc + next.amount: acc - next.amount;
    }, 0); 

    return balance;
}

app.post("/account", (req, res) => {
    const { cpf, name} = req.body;

    const customerAlreadyExixts = customers.some((costumer) => costumer.cpf === cpf)

    if(customerAlreadyExixts) return res.status(400).json({error: "Customer already exixts"});

    customers.push({
        cpf,
        name,
        id: v4(),
        statement: []
    });
    console.log(customers);

    return res.status(201).send();
});

app.put("/account",verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;
    const { name } = req.body;

    customer.name = name;

    return res.status(204).send();
});

app.get("/account", verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
})

app.get("/statement", verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer.statement);
});

app.get("/statement/date", verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(`${date} 00:00`);

    const statement =  customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement);
});

app.post("/deposit", verifyIExistAccountCPF, (req, res) => {
    const {description, amount} = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/withdraw",verifyIExistAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if(amount > balance) return res.status(400).json({error: "Insufficient funds!"});

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.status(200).send();
});

app.delete("/account", verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json(customers);
});

app.get("/balance", verifyIExistAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.status(200).json(balance);
})

app.get("/customers", (req, res) => {
    return res.status(200).json(customers);
});

app.listen(3333);