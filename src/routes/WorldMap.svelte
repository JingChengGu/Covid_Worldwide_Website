<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    let svg;
    let projection;
    let path;
    let worldData; // GeoJSON Data
    let covidData; // COVID-19 Data
    let dates;
    let daysCount;
    let tooltip;
    let showLineGraph = false;
    let globalCovidData;
    let lineGraphSvg;
    let xScale, yScale, xAxis, yAxis;

    function toggleGraph() {
        showLineGraph = !showLineGraph;
    }

    const colorScale = d3.scaleLinear()
        .domain([0, 10000, 50000, 100000, 500000, 1000000])
        .range(["#316754", "#F9F208", "#F5BE16", "#F56016", "#F51616", "#A10707"]);

    function setProjectionAndPath() {
        projection = d3.geoMercator()
            .center([0, 0])
            .scale(100)
            .translate([550, 550]);

        path = d3.geoPath().projection(projection);
        drawMap();
    }

    onMount(async () => {
        worldData = await d3.json('globe.geo.json');
        const covidCsvData = await d3.csv('Covid_data/full_grouped.csv');
        const lineGraphData = await d3.csv('Covid_data/day_wise.csv');
        covidData = processCovidData(covidCsvData);
        window.addEventListener('resize', setProjectionAndPath);
        dates = Object.keys(covidData[Object.keys(covidData)[0]]);
        daysCount = dates.length - 1;

        projection = d3.geoMercator()
            .scale(100)
            .translate([svg.clientWidth / 2, svg.clientHeight / 2]);

        path = d3.geoPath().projection(projection);
        tooltip = d3.select('.tooltip');

        document.getElementById('timeSlider').max = daysCount;

        document.getElementById('timeSlider').addEventListener('input', function() {
        const sliderValue = parseInt(this.value); // Get the slider value as an integer
        const currentDate = dates[sliderValue]; // Get the corresponding date from the 'dates' array
        document.getElementById('sliderLabel').textContent = `Date: ${currentDate}`;
        updateMap(currentDate);
        updateLineGraph(new Date(currentDate));
        });

        setProjectionAndPath();
        drawMap();
        updateMap(dates[0]);
        prepareLineGraphData(lineGraphData);
        drawLineGraph();
    });

    function prepareLineGraphData(lineGraphData) {
        let aggregatedData = {};

        lineGraphData.forEach(d => {
            const date = d.Date;
            const cases = parseInt(d.Confirmed) || 0;
            const deaths = parseInt(d.Deaths) || 0;
            const recovered = parseInt(d.Recovered) || 0;

            if (!aggregatedData[date]) {
                aggregatedData[date] = { cases: 0, deaths: 0, recovered: 0 };
            }

            aggregatedData[date].cases += cases;
            aggregatedData[date].deaths += deaths;
            aggregatedData[date].recovered += recovered;
        });

        globalCovidData = Object.keys(aggregatedData).map(date => ({
            date: d3.timeParse("%Y-%m-%d")(date),
            ...aggregatedData[date]
        }));
    }

    function drawLineGraph() {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 1500 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const g = d3.select(lineGraphSvg)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    xScale = d3.scaleTime()
        .domain(d3.extent(globalCovidData, d => d.date))
        .range([0, width]);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(globalCovidData, d => Math.max(d.cases, d.deaths, d.recovered))])
        .range([height, 0]);

    // Update xAxis setup with time format
    xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%B %d"));


    yAxis = d3.axisLeft(yScale);

    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr('class', 'x-axis')
        .call(xAxis);

    g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Draw lines for cases, deaths, and recovered
    drawLine(g, globalCovidData, 'cases', '#ffab00', xScale, yScale);
    drawLine(g, globalCovidData, 'deaths', '#ff1744', xScale, yScale);
    drawLine(g, globalCovidData, 'recovered', '#00e676', xScale, yScale);
}

    function updateLineGraph(currentDate) {
    const filteredData = globalCovidData.filter(d => d.date <= currentDate);

    // Update xScale domain based on filtered data
    xScale.domain(d3.extent(filteredData, d => d.date));

    // Update yScale domain based on filtered data
    yScale.domain([0, d3.max(filteredData, d => Math.max(d.cases, d.deaths, d.recovered))]);

    // Select and update the x-axis
    d3.select(lineGraphSvg).select('.x-axis')
        .transition()
        .duration(500)
        .call(xAxis);

    // Select and update the y-axis
    d3.select(lineGraphSvg).select('.y-axis')
        .transition()
        .duration(500)
        .call(yAxis);

    // Update lines
    updateLine('Cases', filteredData);
    updateLine('Recovered', filteredData);
    updateLine('deaths', filteredData);
}

function updateLine(metric, filteredData) {
    // Create a new d3 line generator using the updated scales
    const lineGenerator = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d[metric]));

    // Select the path for the specific metric and transition its d attribute
    d3.select(lineGraphSvg).select(`.line.${metric}`)
        .datum(filteredData)
        .transition()
        .duration(500)
        .attr('d', lineGenerator);
}


function drawLine(g, data, metric, color, xScale, yScale) {
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d[metric]));

    // Draw the actual line
    g.append("path")
        .datum(data)
        .attr("class", `line ${metric}`)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3);

    // Add a transparent hit area for easier mouse interaction
    g.append("path")
        .datum(data)
        .attr("class", `hit-area ${metric}`)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 40) // Adjust this value to increase or decrease the hover area
        .on('mouseover', () => tooltip.style('visibility', 'visible'))
        .on('mousemove', (event, d) => {
            const [x, y] = d3.pointer(event);
            const date = xScale.invert(x);
            const closestData = data.reduce((prev, curr) => {
                return (Math.abs(curr.date - date) < Math.abs(prev.date - date) ? curr : prev);
            });
            tooltip
                .html(`<strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}:</strong> ${closestData[metric]}<br/><strong>Date:</strong> ${d3.timeFormat("%B %d")(closestData.date)}`)
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY + 15}px`);
        })
        .on('mouseout', () => tooltip.style('visibility', 'hidden'));
}


    function updatePath(filteredData, metric, color) {
        const lineGenerator = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d[metric]));

        d3.select(lineGraphSvg).select(`.line.${metric}`)
            .datum(filteredData)
            .transition()
            .duration(500)
            .attr('d', lineGenerator)
            .attr('stroke', color);
    }

    function processCovidData(csvData) {
        let processedData = {};

        csvData.forEach(d => {
            const country = d['Country/Region'] === 'US' ? 'United States of America' : d['Country/Region'];
            const cases = parseInt(d.Confirmed) || 0;
            const deaths = parseInt(d.Deaths) || 0;
            const recovered = parseInt(d.Recovered) || 0;
            const date = d.Date;

            if (!processedData[country]) {
                processedData[country] = {};
            }

            if (!processedData[country][date]) {
                processedData[country][date] = { cases: 0, deaths: 0, recovered: 0 };
            }

            processedData[country][date].cases += cases;
            processedData[country][date].deaths += deaths;
            processedData[country][date].recovered += recovered;
        });

        return processedData;
    }

    function drawMap() {
        const paths = d3.select(svg)
            .selectAll('path')
            .data(worldData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const countryData = covidData[d.properties.name];
                const data = countryData && countryData[dates[0]] ? countryData[dates[0]] : { cases: 0, deaths: 0, recovered: 0 };
                const fillColor = colorScale(data.cases);
                d.originalColor = fillColor;
                return fillColor;
            })
            .attr('stroke', '#85F5CC')
            .attr('stroke-width', 0.5);

        paths.on('mouseover', (event, d) => {
                const countryData = covidData[d.properties.name];
                const data = countryData && countryData[dates[0]] ? countryData[dates[0]] : { cases: 0, deaths: 0, recovered: 0 };
                tooltip
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY + 15}px`)
                    .style('visibility', 'visible')
                    .html(`<strong>${d.properties.name}</strong><br/>Cases: ${data.cases}<br/>Deaths: ${data.deaths}<br/>Recovered: ${data.recovered}`);
                const currentColor = d3.select(event.currentTarget).attr('fill');
                const brighterColor = d3.color(currentColor).brighter(1).toString();
                d3.select(event.currentTarget).attr('fill', brighterColor);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY + 15}px`);
            })
            .on('mouseout', function(event, d) {
                tooltip.style('visibility', 'hidden');
                d3.select(event.currentTarget).attr('fill', d.originalColor);
            });
    }

    function updateMap(currentDate) {
        const paths = d3.select(svg).selectAll('path');

        paths.transition()
            .duration(500)
            .attr('fill', d => {
                const countryData = covidData[d.properties.name];
                const data = countryData && countryData[currentDate] ? countryData[currentDate] : { cases: 0, deaths: 0, recovered: 0 };
                const fillColor = colorScale(data.cases);
                d.originalColor = fillColor;
                return fillColor;
            });

        paths.on('mouseover', (event, d) => {
                const countryData = covidData[d.properties.name];
                const data = countryData && countryData[currentDate] ? countryData[currentDate] : { cases: 'No data', deaths: 'No data', recovered: 'No data' };
                tooltip
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY + 15}px`)
                    .style('visibility', 'visible')
                    .html(`<strong>${d.properties.name}</strong><br/>Cases: ${data.cases}<br/>Deaths: ${data.deaths}<br/>Recovered: ${data.recovered}`);
                const currentColor = d3.select(event.currentTarget).attr('fill');
                const brighterColor = d3.color(currentColor).brighter(1).toString();
                d3.select(event.currentTarget).attr('fill', brighterColor);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY + 15}px`);
            })
            .on('mouseout', function(event, d) {
                tooltip.style('visibility', 'hidden');
                d3.select(event.currentTarget).attr('fill', d.originalColor);
            });
    }
</script>

<button on:click={toggleGraph}>{showLineGraph ? 'Show Map' : 'Show Line Graph'}</button>
<div class="map-container" style="display: {showLineGraph ? 'none' : 'block'};">
    <!-- World Map SVG -->
    <svg bind:this={svg} width="100%" height="100%" viewBox="200 200 700 700"></svg>
</div>
<div class="line-graph-container" style="display: {showLineGraph ? 'block' : 'none'};">
    <!-- Line Graph SVG -->
    <svg bind:this={lineGraphSvg} width="100%" height="650"></svg>
</div>
<div class="tooltip" bind:this={tooltip}></div>