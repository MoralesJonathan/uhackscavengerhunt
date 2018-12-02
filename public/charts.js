
$.post('/data', {access_token: localStorage.getItem("access_token"), date: "2018-02-15"}).then(res => {
    console.log(res);
    var ctx = document.getElementById("myChart");
    let steps = res[0]["activities-steps"][0].value;
    var myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Steps Walked Today", "Steps until 10,000"],
            datasets: [{
                label: 'Steps',
                data: [steps, (10000 - steps)],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
})