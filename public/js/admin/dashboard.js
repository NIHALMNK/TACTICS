 const transactionChartCtx = document.getElementById('transactionChart').getContext('2d');
 new Chart(transactionChartCtx, {
     type: 'pie',
     data: {
         labels: ['Transferred', 'EMI Payments'],
         datasets: [{
             data: [400, 800],
             backgroundColor: ['#1abc9c', '#34495e']
         }]
     }
 });

 const customerChartCtx = document.getElementById('customerChart').getContext('2d');
 new Chart(customerChartCtx, {
     type: 'line',
     data: {
         labels: ['Last Month', 'This Month'],
         datasets: [{
             label: 'Customers',
             data: [4097, 5506],
             backgroundColor: '#1abc9c',
             borderColor: '#16a085',
             fill: false
         }]
     }
 });