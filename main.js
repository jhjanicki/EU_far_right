// all variables related to dimensions
const marginTop = 50;

//scale to map original width to pixel width
const lengthScale = d3.scaleLinear().domain([0,d3.max(summary,d=>Math.sqrt(d.total))]).range([0,300]); //620

//add extra width variable to summary stats
summary  = summary.map(d=>{
    return {
        ...d,
        length: lengthScale(Math.sqrt(d.total)),
    }
})

// sort data
summary = summary.sort((a,b)=>b.total-a.total)
data = data.sort((a,b)=>a.total-b.total)

// all related to scales and styles
const countries = [...new Set(summary.map(d=>d.country))];
const fillColorScale = d3.scaleOrdinal()
    .domain(["right","other","rest","other right"])
    .range(["#e4d4fc","#f9dec7","#cbf4cb","#a9d3ea","#fce3f1","#aae5d9","#f7b1a1"])

//convert data to hierarchical format
const convertDataHierarchy = (data)=>{
    const groupingFn = [d => d.category]; 
    const rollupData = d3.rollup(data, v => d3.sum(v, d => d.total), ...groupingFn);
    const childrenAccessorFn = ([key, value]) => value.size && Array.from(value);
    return d3.hierarchy(rollupData, childrenAccessorFn)
        .sum(([key, value]) => value);
}

// Layout + data prep
const setupTreemap = (length) =>{
    return d3.treemap()
        .paddingInner(1)
        .paddingOuter(2)
        .paddingTop(1)
        .round(true)
        .size([length, length])
        .tile(d3.treemapBinary);
}

const drawTree = (shape,svg,fill) =>{
    const dataFiltered = data.filter(d=>d.country ===shape.country);
    const hierarchyData = convertDataHierarchy(dataFiltered);
    const treemap = setupTreemap(shape.length, shape.length);
    const root = treemap(hierarchyData);
    const leaves = root.leaves();
    const g = svg.append("g").attr("transform",`translate(0,${marginTop})`);
    g.selectAll("rect")
        .data(leaves)
        .join("rect")
        .attr("class", shape.country)
        .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("rx",2)
        .attr("ry",2)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("fill",  d=> fillColorScale(d.data[0]))
        .attr("opacity", 1);

    g.selectAll("text")
        .data(root.leaves())
        .join("text")
        .attr("x", d => d.x0 + 2)
        .attr("y", d => d.y0 + 10)
        .text(d => d.value===0?"":`${d.data[0]}: ${d.value}`);
    
    svg.append("text").attr("x",0).attr("y",marginTop-5).attr("font-weight",700).attr("font-size", 15).text(`${shape.country}`);
}
//loop over each summary object, each will either become a treemap or a rect
summary.forEach(shape=>{

    const svg = d3.select("#chart").append("svg")
        .attr("width", shape.length)
        .attr("height", shape.length+marginTop);
        drawTree(shape,svg,"#a8ddb5")
    
})