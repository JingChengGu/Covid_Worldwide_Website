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
    let lineGraphSvg;

    const colorScale = d3.scaleLinear()
            .domain([0, 10000, 50000, 100000, 500000, 1000000])
            .range(["#316754", "#F9F208", "#F5BE16", "#F56016", "#F51616", "#A10707"]);


    function setProjectionAndPath() {
    // Remove the scaling based on svg.clientWidth / svg.clientHeight
    // The viewBox will handle scaling, so we only need to focus on centering the map

    projection = d3.geoMercator()
        .center([0, 0]) // Adjust this to change the initial centering of the map, if necessary
        .scale(100) // Set a default scale; this will be scaled according to the viewBox
        .translate([550, 550]); // Translate to the center of the viewBox dimensions

    path = d3.geoPath().projection(projection);
    drawMap(); // Redraw the map with the new projection settings
    }



    onMount(async () => {
        worldData = await d3.json('globe.geo.json');
        const covidCsvData = await d3.csv('Covid_data/full_grouped.csv');
        const lineGraphData = await d3.csv('Covid_data/day_wise.csv');
        lineGraphData.forEach(d => {
            // Convert string dates to Date objects and strings to numbers
            d.Date = new Date(d.Date);
            d.Confirmed = +d.Confirmed;
            d.Deaths = +d.Deaths;
            d.Recovered = +d.Recovered;
        });
        covidData = processCovidData(covidCsvData);
        window.addEventListener('resize', () => {
        setProjectionAndPath();
        updateMap(dates[0]); // Make sure to pass the correct current date
        });
        dates = Object.keys(covidData[Object.keys(covidData)[0]]);
        daysCount = dates.length - 1;
    
        // map projection
        projection = d3.geoMercator()
            .scale(100)
            .translate([svg.clientWidth / 2, svg.clientHeight / 2]);
    
        path = d3.geoPath().projection(projection);
        tooltip = d3.select('.tooltip');
        

        // Select the tooltip element using D3
        document.getElementById('timeSlider').max = daysCount;

        document.getElementById('timeSlider').addEventListener('input', function() {
            const currentDate = dates[this.value];
            document.getElementById('sliderLabel').textContent = `Date: ${currentDate}`;
            updateMap(currentDate);
        });
        
        setProjectionAndPath();
        drawMap();
        updateMap(dates[0]);
        drawLineGraph(lineGraphData);
    });

    function drawLineGraph(data) {
    // Set up dimensions and margins for the line graph
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 460 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Append a 'g' element to the line graph SVG
    const g = d3.select(lineGraphSvg)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    // Set up scales and axes
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Confirmed)]) // Assuming you want to use confirmed cases for y-axis scale
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Create the line generators and append the 'path' elements for cases, deaths, and recovered
    // Draw the x-axis and y-axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    g.append('g')
        .call(yAxis);

    // Call the drawLine function for each metric
    drawLine(g, data, 'Confirmed', 'steelblue', xScale, yScale);
    drawLine(g, data, 'Recovered', 'green', xScale, yScale);
    drawLine(g, data, 'Deaths', 'red', xScale, yScale);
    }

    function drawLine(g, data, metric, color) {
        g.append("path")
            .datum(data)
            .attr("d", d3.line()
                .x(d => xScale(d.Date)) // Make sure this is 'd.Date' if that is what your data uses
                .y(d => yScale(d[metric]))) // 'metric' should be 'Confirmed', 'Recovered', or 'Deaths'
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5);
    }



    function processCovidData(csvData) {
    let processedData = {};

    csvData.forEach(d => {
        // If the country is labeled 'US', change it to 'United States'
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

        // Aggregate the data for 'United States'
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
                d.originalColor = fillColor; // Store the original color in the data object
                return fillColor;
            })
            .attr('stroke', '#85F5CC') // Set the stroke color to black
            .attr('stroke-width', 0.5); // Set the stroke width

        // Attach event listeners
        paths.on('mouseover', (event, d) => {
            const countryData = covidData[d.properties.name];
            const data = countryData && countryData[dates[0]] ? countryData[dates[0]] : { cases: 0, deaths: 0, recovered: 0 };
            tooltip
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY + 15}px`)
                .style('visibility', 'visible')
                .html(`<strong>${d.properties.name}</strong><br/>Cases: ${data.cases}<br/>Deaths: ${data.deaths}<br/>Recovered: ${data.recovered}`);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY + 15}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });

    }


    function updateMap(currentDate) {
        const paths = d3.select(svg).selectAll('path');

        // Transition colors
        paths.transition()
            .duration(500)
            .attr('fill', d => {
                const countryData = covidData[d.properties.name];
                const data = countryData && countryData[currentDate] ? countryData[currentDate] : { cases: 0, deaths: 0, recovered: 0 };
                const fillColor = colorScale(data.cases);
                d.originalColor = fillColor; // Update the original color in the data object
                return fillColor;
            });

        // Reattach tooltip event listeners
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
            d3.select(event.currentTarget).attr('fill', d.originalColor); // Reset to the original color
        });
    }


</script>

<!-- Line Graph SVG -->
<svg bind:this={lineGraphSvg} width="100%" height="300"></svg>

<!-- World Map SVG -->
<svg bind:this={svg} width="100%" height="100%" viewBox="200 200 700 700"></svg>

<div class="tooltip" bind:this={tooltip}></div>