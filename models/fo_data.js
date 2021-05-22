const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fo_schema = new Schema({
    TIMESTAMP: String,
    INSTRUMENT: String,
    SYMBOL: String,
    OPEN: Number,
    HIGH: Number,
    LOW: Number,
    CLOSE: Number,
    COI: Number,
    PCR: Number,
});


module.exports = mongoose.model('fo_data', fo_schema);