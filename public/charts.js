
$.post('/data', {access_token: localStorage.getItem("access_token"), date: "2018-02-15"}).then(res => {
    console.log(res);
    var ctx = document.getElementById("steps");
    var aChart = document.getElementById("activities");
    let steps = res[0]["activities-steps"][0].value;
    let activities = res[1];
    let activitiesLabels = [];
    let activitiesDatasets = [{}]
    activitiesDatasets[0].borderColor = ['rgba(255,99,132,1)',
    'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)']
    activitiesDatasets[0].backgroundColor = ['rgba(255,99,132, 0.2)',
    'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'];
    activitiesDatasets[0].borderWidth = 1;

    console.log(activitiesDatasets);
    var activitiesChart = new Chart(aChart, {
        type: 'doughnut',
        data: {
            labels: activitiesLabels,
            datasets: activitiesDatasets
        }
    })

    activities.forEach(activity => {
        activitiesLabels.push(activity.name);
        activitiesDatasets[0].data.push(activity.distance);
    });
    var stepsChart = new Chart(ctx, {
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
        }
    });
})