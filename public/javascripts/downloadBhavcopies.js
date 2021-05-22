function compute(date_selected) {
    dmonth = { '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC' }
    let date_array = date_selected.split("-");
    let y = date_array[0];

    let m = dmonth[date_array[1]];

    let d = date_array[2];

    let file_path = `fo${d}${m}${y}bhav.csv.zip`;

    $.post('/home', { file_path, date: `${d}-${m}-${y}` });
}
