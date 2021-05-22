if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const morgan = require('morgan');
const catchAsync = require('./utils/catchAsync');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const fo_data = require('./models/fo_data');
const csv = require('csvtojson');
const ejs = require('ejs');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const fs = require('fs')
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log('Database Connected');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));

const sessionConfig = {
    name: 'fo-charting-session',
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
};

app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/home', catchAsync(async (req, res) => {
    console.log(req.query);
    let curr_today = new Date().toISOString().substring(0, 10);
    const { date = curr_today } = req.query;
    let dates = [];

    let curr_date = new Date(date);
    today = new Date();
    dmonth = { '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC' }

    for (let day = curr_date; day <= today; day = new Date(day.getTime() + 24 * 60 * 60 * 1000)) {
        if (day.getDay() == 0 || day.getDay() == 6) {
            continue;
        }
        let iso_day = day.toISOString().substring(0, 10);

        let date_array = iso_day.split("-");
        let y = date_array[0];

        let m = dmonth[date_array[1]];

        let d = date_array[2];

        let url = `https://archives.nseindia.com/content/historical/DERIVATIVES/${y}/${m}/fo${d}${m}${y}bhav.csv.zip`;
        dates.push({ iso_day, url });
    }
    res.render('home', { dates });
}));

app.post('/home', catchAsync(async (req, res) => {
    let { file_path, date } = req.body;
    console.log('in post-', file_path)

    let date_format = date.split("-");
    d = date_format[0];
    m = date_format[1][0] + date_format[1].slice(1).toLowerCase();
    y = date_format[2].slice(2);
    date = (d + "-" + m + "-" + y);

    const isPresent = await fo_data.countDocuments({ TIMESTAMP: date });
    console.log(isPresent, date);

    if (isPresent != 0) {
        req.flash('Date Bhavcopy already added');
    } else {
        let dataToSend, isSuccess;
        // spawn new child process to call the python script
        const python = spawn('python', ['script.py', file_path, process.env.PRE_PATH, process.env.FILE_NAME]);
        // collect data from script
        python.stdout.on('data', function (data) {
            dataToSend = data.toString();
        });

        // in close event we are sure that stream from child process is closed
        python.on('close', async (code) => {
            console.log(`${date} successfuly appended`, code);
            //console.log(JSON.stringify(dataToSend));
            // send data to browser
            for (let stock of JSON.parse(dataToSend)) {
                let timestamp_format = stock[0].split("-");
                d = timestamp_format[0];
                m = timestamp_format[1][0] + timestamp_format[1].slice(1).toLowerCase();
                y = timestamp_format[2].slice(2);
                final_timestamp = (d + "-" + m + "-" + y);

                let new_fo_row = new fo_data({
                    TIMESTAMP: final_timestamp,
                    INSTRUMENT: stock[1],
                    SYMBOL: stock[2],
                    OPEN: stock[3],
                    HIGH: stock[4],
                    LOW: stock[5],
                    CLOSE: stock[6],
                    COI: stock[7],
                    PCR: stock[8],
                })
                await new_fo_row.save();
            }
        });
        req.flash('success', 'Date Bhavcopy added');
    }
    res.redirect('/show');
}));

app.post('/show', catchAsync(async (req, res) => {
    console.log(req.body.details);
    let { timestamp, symbol } = req.body.details;
    timestamp = timestamp == "" ? "-" : timestamp;
    symbol = symbol == "" ? "-" : symbol;

    res.redirect(`/show/${timestamp}/${symbol}`);
}))

app.get('/show', catchAsync(async (req, res) => {
    const output_file = await fo_data.find().sort({ _id: -1 }).limit(150)
    res.render('show', { output_file });
}));

app.get('/show/:timestamp/:symbol', catchAsync(async (req, res) => {

    const { timestamp, symbol } = req.params;
    const query = {};
    if (timestamp != "-") {
        query['TIMESTAMP'] = timestamp;
    }
    if (symbol != "-") {
        query['SYMBOL'] = symbol.toUpperCase();
    }
    const output_file = await fo_data.find(query)
    res.render('show', { output_file });
}));

app.get('/chart', catchAsync(async (req, res) => {
    let { symbol = 'NIFTY' } = req.query;
    console.log(req.query, symbol);

    const data = await fo_data.find({ SYMBOL: symbol.toUpperCase() });

    res.render('chart', { data, symbol: symbol.toUpperCase() });
}));

app.get('/seed', catchAsync(async (req, res) => {
    let data = [];
    fs.readFile('output.json', async (err, data) => {
        if (err) throw err;
        data = JSON.parse(data);
        await fo_data.collection.insertMany(data);
    });
    res.send('finished')
}));

app.get('/remove', catchAsync(async (req, res) => {
    await fo_data.remove({});
    res.send('hello');
}));

app.get('/envvars', catchAsync(async (req, res) => {
    res.send(process.env.PORT, process.env.PRE_PATH, process.env.FILE_NAME)
}));


app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something Went Wrong" } = err;
    if (!err.message) err.message = 'Oh no something went wrong!'
    res.send({ statusCode, message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
});


