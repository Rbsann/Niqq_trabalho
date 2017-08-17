var apiUrl = "http://127.0.0.1:8080/stats/";

function showSvg(){
    $('canvas').hide();
    $('svg').show();
}

function showCanvas(){
    $('svg').hide();
    $('#render_chart').html('');
    $('#render_chart').html('<canvas id="chart" width="500" height="500" ></canvas>');
    $('canvas').show();
}

$(function(){
    $('#opcoes').on('change', function () {
        $.get(apiUrl + $('#opcoes').val())
        .done(function(graphData){
            if($('#opcoes').val() === 'fill'){
                showSvg();
                createHistogram(graphData);
            }else{
                showCanvas();
                let context = document.getElementById("chart").getContext('2d');
                let graph = new Chart(context, graphData);
                $("chart").html(graph);
            }
        });
    });
});

function createHistogram(data){
    data = [0,0,0,0,0,0,0,0,3,3,3,4,4,4,4, 3,3,3,3,3,3,3,3,3,1,2,3,4,5,5,6,6,7,3,2,2,12];
    var width=500,
        height=500,
        padding=50;

    var histogram = d3.layout.histogram()
                    .bins(3)
                    (data);

    var canvas = d3.select("svg")
    .attr("width",width)
    .attr("height",height+padding);

    var y=d3.scale.linear()
        .domain ([0,d3.max(histogram.map(function (i) {return i.length; }))])
        .range([0,height]);

    var x=d3.scale.linear()
            .domain([0,d3.max(data)])
            .range([0,width])

    var xAxis=d3.svg.axis()
                .scale(x)
                .orient("bottom");

    var group=canvas.append("g")
            .attr("transform","translate(0," +height+ ")")
            .call(xAxis);

    var bars=canvas.selectAll(".bar")
        .data(histogram)
        .enter()
        .append("g")
        .attr("transform","translate(20,0)")

    bars.append("rect")
        .attr("x",function (d) {return x(d.x); })
        .attr("y", function(d) {return 500- y(d.y);})
        .attr("width",function(d) {return d.dx; })
        .attr("height",function(d) {return y(d.y) ;})
        .attr("fill","steelblue");

    bars.append("text")
        .attr("x", function(d) {return x(d.x); })
        .attr("y",function(d) {return 500- y(d.y); })
        .attr("dx",function(d) {return x(d.dx)/2; })
        .attr("dy","20px")      
        .attr("fill","#fff")
        .attr("text-anchor","middle")
        .text(function(d) {return d.y});
}