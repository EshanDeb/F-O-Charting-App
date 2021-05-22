function plotChart(data) {
    let dataJSON = JSON.parse(data);

    const removeDuplicatesFromArrayByProperty = (arr, prop) => arr.reduce((accumulator, currentValue) => {
        if (!accumulator.find(obj => obj[prop] === currentValue[prop])) {
            accumulator.push(currentValue);
        }
        return accumulator;
    }, [])

    dataJSON = removeDuplicatesFromArrayByProperty(dataJSON, 'TIMESTAMP');

    const chartProperties = {
        height: window.innerHeight,
        width: window.innerWidth,
        overlay: true,
    }
    const domElement = document.getElementById('tvchart');

    const chart = LightweightCharts.createChart(domElement, chartProperties);
    const candleSeries1 = chart.addCandlestickSeries();

    let cdata = [];

    const dmonth = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' }

    dataJSON.forEach(function (d) {
        let split_date = d.TIMESTAMP.split("-");
        let year = "20" + split_date[2] + "-" + dmonth[split_date[1]] + "-" + split_date[0];
        cdata.push({ time: year, open: d.OPEN, high: d.OPEN, low: d.LOW, close: d.CLOSE });
    })

    candleSeries1.setData(cdata);

    const pcrHistogram = chart.addHistogramSeries({
        title: "PCR",
        color: 'red',
        lineWidth: 2,
        overlay: true,
        scaleMargins: {
            top: 0,
            bottom: 0.9,
        },
    });

    const pcrData = [];
    let factor = Math.pow(10, 2)

    dataJSON.forEach(function (d) {
        let split_date = d.TIMESTAMP.split("-");
        let year = "20" + split_date[2] + "-" + dmonth[split_date[1]] + "-" + split_date[0];
        pcrData.push({ time: year, value: d.PCR * factor });
    })

    pcrHistogram.setData(pcrData);

    const coiHistogram = chart.addHistogramSeries({
        title: "COI",
        color: 'green',
        lineWidth: 2,
        overlay: true,
        priceFormat: {
            type: 'volume',
        },
        scaleMargins: {
            top: 0.9,
            bottom: 0,
        },
    });

    const coiData = [];

    dataJSON.forEach(function (d) {
        let split_date = d.TIMESTAMP.split("-");
        let year = "20" + split_date[2] + "-" + dmonth[split_date[1]] + "-" + split_date[0];
        coiData.push({ time: year, value: d.COI });
    })

    coiHistogram.setData(coiData);
}