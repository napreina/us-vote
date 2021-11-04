var canvas = { width: 930, height: 2120 };

var margin = { top: 20, right: 50, bottom: 20, left: 250 },
    headerHeight = 90,
    rowHeight = 130;

var width = canvas.width - margin.left - margin.right;
var height = canvas.height - margin.top - margin.bottom - headerHeight;

var formatNumber_0 = d3.format(".0f"),
    formatNumber_1 = d3.format(".1f"),
    formatNumber_2 = d3.format(".2f");

var sankey = d3.sankey()
    .demColor("#99BFE5")
    .repColor("#FDA3A6")
    .linkColor("#EEEEEE")
    .nodeHeight(20)
    .nodeUnitWidth(1)
    .nodeUnit(3)
    .rowHeight(rowHeight)
    .size([width, height]);

var svg = d3.select("#chart").append("svg")
    .attr({
        "width": canvas.width,
        "height": canvas.height
    })

// x-tick
var startYear = 1952,
    endYear = 2012
stateCount = 51;

var xlabel = ["≥50%", "+40%", "+30%", "+20%", "+10%", "", "+10%", "+20%", "+30%", "+40%", "≥50%"];
var presidents = [
    "Obama", "Romney",
    "Obama", "McCain",
    "Kerry", "Bush",
    "Gore", "Bush",
    "Clinton", "Dole",
    "Clinton", "Bush",
    "Dukakis", "Bush",
    "Mondale", "Reagan",
    "Carter", "Reagan",
    "Carter", "Ford",
    "McGovern", "Nixon",
    "Humphrey", "Nixon",
    "Johnson", "Goldwater",
    "Kennedy", "Nixon",
    "Stevenson", "Eisenhower",
    "Stevenson", "Eisenhower"
];

var votesTotal = [
    "303±29", "206±29",
    365, 173,
    251, 286,
    266, 271,
    379, 159,
    370, 168,
    111, 426,
    13, 525,
    49, 489,
    297, 240,
    17, 520,
    191, 301,
    486, 52,
    303, 219,
    73, 457,
    89, 442
];

var contentY = [0, 2, 4, 6, 9, 12];

var columns = [],
    rows = [];
for (var i = 0; i < 11; i++) {
    var column = {};
    column.x = width / 10 * i;
    column.label = xlabel[i];

    columns.push(column);
}

var rowIndex = 0;
for (var i = endYear; i >= startYear; i -= 4) {
    var row = {};
    row.index = rowIndex;
    row.y = rowIndex * rowHeight + sankey.nodeHeight() / 2 + 5;
    row.label = i;
    row.demPresident = presidents[rowIndex * 2];
    row.repPresident = presidents[rowIndex * 2 + 1];
    row.demVotes = votesTotal[rowIndex * 2];
    row.repVotes = votesTotal[rowIndex * 2 + 1];

    rows.push(row);

    rowIndex++;
}

// header
var header = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

header.append("line")
    .attr({
        "x1": width / 2,
        "y1": -10,
        "x2": width / 2,
        "y2": 30
    })
    .style({
        "fill": "none",
        "stroke-width": 1,
        "stroke": "black",
        "shape-rendering": "crispEdges"
    })

header.append("line")
    .attr({
        "x1": -margin.left,
        "y1": 40,
        "x2": width + margin.right,
        "y2": 40
    })
    .style({
        "fill": "none",
        "stroke-width": 1,
        "stroke": sankey.linkColor().darker(0.1),
        "shape-rendering": "crispEdges"
    })

header.append("text")
    .attr({
        "text-anchor": "end",
        "x": width / 2 - 10,
        "y": 0,
        "font-size": 12,
        "font-family": "serif",
        "fill": sankey.demColor().darker(1.5),
    })
    .text("← MORE DEMOCRATIC");

header.append("text")
    .attr({
        "text-anchor": "start",
        "x": width / 2 + 10,
        "y": 0,
        "font-size": 12,
        "font-family": "serif",
        "fill": sankey.repColor().darker(1.5),
    })
    .text("MORE REPUBLICAN →");

header.selectAll(".label")
    .data(columns)
    .enter().append('text')
    .attr({
        "class": "label",
        "text-anchor": "middle",
        "x": function(d) { return d.x },
        "y": 20,
        "font-size": 12,
        "font-family": "serif",
        "font-weight": "normal",
        "fill": sankey.linkColor().darker(3)
    })
    .text(function(d) { return d.label });


// left side - content
d3.select(".sidebar").selectAll(".item")
    .data(contentY)
    .style({
        top: function(d, i) {
            var top = (headerHeight + d * rowHeight + 25);

            if (i == 1)
                top += 15;

            return top + "px"
        },
        opacity: 1
    })

d3.select(".sidebar").select(".toggle-buttons")
    .style({
        top: "15px"
    })

// main
var main = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top + headerHeight) + ")");

var _column = main.append("g").selectAll(".column")
    .data(columns).enter();

_column.append('line')
    .attr({
        "class": 'column',
        "x1": d => d.x,
        "y1": -35,
        "x2": d => d.x,
        "y2": height + 10,
    })
    .style({
        "stroke-width": 1,
        "stroke-dasharray": "1, 3",
        "stroke": sankey.linkColor().darker(1),
        "shape-rendering": "crispEdges"
    })

// right side - year
var _year = main.append("g").selectAll(".year")
    .data(rows)
    .enter().append('text')
    .attr({
        "class": "year",
        "text-anchor": "middle",
        "x": width + 25,
        "y": d => d.y,
        "font-size": 12,
        "font-family": "serif",
        "font-weight": "normal",
        "fill": sankey.linkColor().darker(2)
    })
    .text(function(d) { return d.label });

// link path
var path = sankey.link();

d3.json("data/votes.json", function(raw) {
    data = sankey.parse(raw, startYear, endYear, stateCount);
    sankey
        .nodes(data.nodes)
        .links(data.links)
        .highlights(data.highlights)
        .layout();

    // link
    var main_g = main.append("g");

    var link = main_g.selectAll(".link")
        .data(sankey.links()).enter();

    link.append("path")
        .attr({
            "class": "link",
            "data-name": d => d.source.name,
            "data-highlight": d => d.highlight,
            "d": path,
        })
        .style({
            "fill-opacity": 0.7,
            "fill": d => d.stroke,
        })
        .on({
            "mouseover": d => highlight_path(d.source.id),
            "mouseout": d => highlight_path(d.source.id, false)
        })

    // gradient
    var defs = link.append("defs");
    var gradient = defs.append("linearGradient")
        .attr({
            "id": d => "g_" + d.id,
            "gradientUnits": function(d) {
                return d.source.x == d.target.x ? "userSpaceOnUse" : "objectBoundingBox"
            },
            "x1": "0%",
            "y1": "0%",
            "x2": "0%",
            "y2": "100%"
        })

    gradient.append("stop")
        .attr({
            "offset": "70%",
            "stop-color": d => d.source.color
        })

    gradient.append("stop")
        .attr({
            "offset": "100%",
            "stop-color": d => d.target.color
        })

    // center axis
    main_g.append('line')
        .attr({
            "class": 'center-axis',
            "x1": width / 2,
            "y1": -35,
            "x2": width / 2,
            "y2": height + 10,
        })
        .style({
            "stroke-width": 1,
            "stroke": "black",
            "shape-rendering": "crispEdges"
        })

    // highlights
    var _highlights = d3.selectAll(".link[data-highlight='true']")
        .each(function() {
            d3.select(this).moveToFront();
        })

    // *** draw nodes ***
    var node = main.append("g").selectAll(".node")
        .data(sankey.nodes())
        .enter().append("g")
        .attr({
            "class": "node",
            "data-name": function(d) { return d.name },
            "transform": function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            }
        })

    node.append("rect")
        .attr({
            "height": sankey.nodeHeight(),
            "width": function(d) { return d.dy; }
        })
        .style({
            "fill": function(d) { return d.color },
            "stroke-width": 0.7,
            "stroke": function(d) { return d.color.darker(1.5); }
        })
        .on({
            'mouseover': function(d) { highlight_path(d.id) },
            'mouseout': function(d) { highlight_path(d.id, false) }
        })

    node.append("text")
        .attr({
            "text-anchor": "middle",
            "x": function(d) { return d.dy / 2 },
            "y": sankey.nodeHeight() + 15,
            "font-size": 11,
            "font-weight": "bold",
            "visibility": "hidden"
        })
        .text(function(d) {
            var diff = Math.abs(d.diff);

            if (diff >= 10) {
                diff = +formatNumber_0(diff);
            } else if (diff >= 1) {
                diff = +formatNumber_1(diff);
            } else {
                diff = +formatNumber_2(d.diff);
            }

            return "+" + Math.abs(diff) + "%";
        });


    // left side - indicator
    var _indicator = main.append("g");

    var indicatorStyle = {
        "fill": "none",
        "stroke-width": 1,
        "stroke": sankey.linkColor().darker(0.5),
        "shape-rendering": "crispEdges"
    };

    // Obama Re-elected
    _indicator.append("path")
        .attr({
            "class": "indicator",
            "d": function() {
                var _y = rowHeight * contentY[0],
                    x0 = -80,
                    y0 = _y + sankey.nodeHeight() / 2,
                    x1 = -20,
                    y1 = y0,
                    x2 = x1,
                    y2 = _y - 5,
                    x3 = x1,
                    y3 = _y + sankey.nodeHeight() + 5,
                    x4 = x2 + 5,
                    y4 = y2,
                    x5 = x3 + 5,
                    y5 = y3;

                return `M${x0},${y0}L${x1},${y1}M${x2},${y2}L${x3},${y3}L${x5},${y5}M${x2},${y2}L${x4},${y4}`;
            },
        })
        .style(indicatorStyle)

    // As Goes Ohio
    _indicator.append("path")
        .attr({
            "class": "indicator",
            "d": function() {
                var _y = rowHeight * contentY[1] + 15,
                    x0 = -30,
                    y0 = _y + sankey.nodeHeight() / 2,
                    x1 = 330,
                    y1 = y0;

                return `M${x0},${y0}L${x1},${y1}`;
            },
        })
        .style(indicatorStyle)
    _indicator.append("circle")
        .attr({
            "cx": 330,
            "cy": function() {
                return rowHeight * contentY[1] + sankey.nodeHeight() / 2 + 15;
            },
            "r": 1.5
        })
        .style(indicatorStyle)

    // Incumbent Stability
    _indicator.append("path")
        .attr({
            "class": "indicator",
            "d": function() {
                var _y = rowHeight * contentY[2],
                    x0 = -30,
                    y0 = _y + sankey.nodeHeight() / 2,
                    x1 = -20,
                    y1 = y0,
                    x2 = x1,
                    y2 = _y - 10,
                    x3 = x1,
                    y3 = _y + rowHeight + sankey.nodeHeight() + 10,
                    x4 = x2 + 5,
                    y4 = y2,
                    x5 = x3 + 5,
                    y5 = y3;

                return `M${x0},${y0}L${x1},${y1}M${x2},${y2}L${x3},${y3}L${x5},${y5}M${x2},${y2}L${x4},${y4}`;
            },
        })
        .style(indicatorStyle)

    // Home-State Advantage
    _indicator.append("path")
        .attr({
            "class": "indicator",
            "d": function() {
                var _y = rowHeight * contentY[4],
                    x0 = -30,
                    y0 = _y + sankey.nodeHeight() / 2,
                    x1 = 100,
                    y1 = y0;

                return `M${x0},${y0}L${x1},${y1}`;
            },
        })
        .style(indicatorStyle)

    _indicator.append("circle")
        .attr({
            "cx": 98,
            "cy": function() {
                return rowHeight * contentY[4] + sankey.nodeHeight() / 2;
            },
            "r": 1.2
        })
        .style(indicatorStyle)

    // A Switch in the South
    _indicator.append("path")
        .attr({
            "class": "indicator",
            "d": function() {
                var _y = rowHeight * contentY[5],
                    x0 = -30,
                    y0 = _y + sankey.nodeHeight() / 2,
                    x1 = -20,
                    y1 = y0,
                    x2 = x1,
                    y2 = _y - 10,
                    x3 = x1,
                    y3 = _y + rowHeight + sankey.nodeHeight() + 10,
                    x4 = x2 + 5,
                    y4 = y2,
                    x5 = x3 + 5,
                    y5 = y3;

                return `M${x0},${y0}L${x1},${y1}M${x2},${y2}L${x3},${y3}L${x5},${y5}M${x2},${y2}L${x4},${y4}`;
            },
        })
        .style(indicatorStyle)

    var over = false,
        prevName = '',
        timer = null;

    function highlight_off(name) {

        var _nodes = d3.selectAll(".node[data-name='" + name + "']");
        var _links = d3.selectAll(".link[data-name='" + name + "']");
        var _tooltip = d3.select("#tooltip");

        _nodes.moveToBack();
        _nodes.selectAll("text").attr('visibility', "hidden");
        _nodes.selectAll("rect")
            .style({
                "stroke-width": 0.7,
                "stroke": d => d.color.darker(1.5)
            })

        // links
        _links.style({
                "stroke-width": 0,
                "fill": d => d.stroke,
                "fill-opacity": 0.7
            })
            .each(function(d) {
                if (!d.highlight) {
                    d3.select(this).moveToBack();
                }
            })

        // tooltip
        if (!over)
            _tooltip.style("visibility", "hidden")
    }

    function highlight_path(id, highlight = true) {
        var node = sankey.nodes()[id];
        var name = node.name;

        var _nodes = d3.selectAll(".node[data-name='" + name + "']");
        var _links = d3.selectAll(".link[data-name='" + name + "']");
        var _tooltip = d3.select("#tooltip");

        if (highlight) {
            over = true;

            clearTimeout(timer);
            highlight_off(prevName);

            _nodes.moveToFront();
            _nodes.selectAll("text").attr('visibility', "visible");
            _nodes.selectAll("rect")
                .style({
                    "stroke-width": 2,
                    "stroke": d => d3.rgb(0)
                })

            // links
            _links.style({
                    "stroke-width": 1,
                    "stroke": "white",
                    "fill": d => "url(#g_" + d.id + ")",
                    "fill-opacity": 1
                })
                .each(function(d) {
                    d3.select(this).moveToFront();
                })

            // tooltip
            var _w = _tooltip.style('width').slice(0, -2);
            var _h = _tooltip.style('height').slice(0, -2);

            _tooltip
                .style({
                    left: (node.x + margin.left - _w / 2) + "px",
                    top: (node.y + margin.top + headerHeight - _h - sankey.nodeHeight()) + "px",
                    visibility: "visible"
                })

            _tooltip.select('.state').text(node.name);
            _tooltip.select('.votes').text(node.votes + " electoral votes");
            _tooltip.select('.dem').text(formatNumber_1(node.dem) + "%");
            _tooltip.select('.rep').text(formatNumber_1(node.rep) + "%");

        } else {
            over = false;

            timer = setTimeout(function() {
                highlight_off(name);
            }, 2000);
        }

        prevName = name;
    }
});

// president
var _president = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top + headerHeight) + ")")
    .selectAll(".president")
    .data(rows).enter();

_president.append('text')
    .attr({
        "class": "president",
        "text-anchor": "end",
        "x": width / 2 - 10,
        "y": d => d.y - 25,
        "font-size": 17,
        "font-family": "serif",
        "font-weight": "normal",
        "fill": sankey.demColor().darker(2)
    })
    .text(function(d) { return d.demPresident });

_president.append('text')
    .attr({
        "class": "yinfo",
        "text-anchor": "start",
        "x": width / 2 + 10,
        "y": d => d.y - 25,
        "font-size": 17,
        "font-family": "serif",
        "font-weight": "normal",
        "fill": sankey.repColor().darker(2)
    })
    .text(function(d) { return d.repPresident });


// toggle highlights
function highlight_states(states) {
    sankey.highlightLinks(states);

    main.selectAll(".link")
        .style({
            fill: d => d.stroke
        })
        .attr({
            "data-highlight": d => d.highlight
        })

    main.selectAll(".column")
        .each(function() {
            d3.select(this).moveToFront();
        })

    main.select('.center-axis').moveToFront();

    d3.selectAll(".link[data-highlight='true']")
        .each(function() {
            d3.select(this).moveToFront();
        })

    var _nodes = d3.selectAll(".node");

    _nodes.selectAll("text")
        .attr("visibility", "hidden");
    _nodes.selectAll("rect")
        .style("stroke-width", 0.7)
        .style("stroke", d => d.color.darker(1.5));

    if (states.length == 1) {
        var stateId = 0;
        if (states[0] == 35) { // Ohio
            stateId = 137;
        } else if (states[0] == 10) { // Georgia
            stateId = 469;
        }

        var node = sankey.nodes()[stateId];
        var name = node.name;

        var _state = d3.selectAll(".node[data-name='" + name + "']");

        _state.each(function() {
            d3.select(this).moveToFront();
        })

        _state.selectAll("text")
            .attr('visibility', "visible");

        _state.selectAll("rect")
            .style("stroke-width", 2)
            .style("stroke", d3.rgb(0))

        // tooltip
        var _tooltip = d3.select("#tooltip");
        var _w = _tooltip.style('width').slice(0, -2);
        var _h = _tooltip.style('height').slice(0, -2);

        _tooltip
            .style({
                left: (node.x + margin.left - _w / 2) + "px",
                top: (node.y + margin.top + headerHeight - _h - sankey.nodeHeight()) + "px",
                visibility: "visible"
            })

        _tooltip.select('.state').text(node.name);
        _tooltip.select('.votes').text(node.votes + " electoral votes");
        _tooltip.select('.dem').text(formatNumber_1(node.dem) + "%");
        _tooltip.select('.rep').text(formatNumber_1(node.rep) + "%");
    } else {
        d3.select("#tooltip").style("visibility", "hidden");
    }
}

function relayout(type) {
    sankey.relayout(type);

    // relayout nodes
    main.selectAll(".node")
        .each(function(d) {
            d3.select(this)
                .transition()
                .duration(500)
                .attr({
                    "transform": function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    }
                })
        })

    // relayout links
    main.selectAll(".link")
        .each(function(d) {
            d3.select(this)
                .transition()
                .duration(500)
                .attr({
                    "d": path,
                })
        })

    // total votes
    if (type == 1) {
        var exist = svg.selectAll('.total-votes').size();
        if (exist) {
            svg.selectAll('.total-votes').transition().style("opacity", 1);
        } else {
            var _totalVotes = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + (margin.top + headerHeight) + ")")
                .selectAll(".total-votes")
                .data(rows).enter();

            _totalVotes.append('text')
                .attr({
                    "class": "total-votes",
                    "text-anchor": "end",
                    "x": function(d) {
                        return width / 2 - sankey.nodes()[d.index * stateCount].demPos - 5;
                    },
                    "y": d => d.y,
                    "font-size": 17,
                    "font-weight": "normal",
                    "fill": sankey.demColor().darker(2)
                })
                .text(function(d) { return d.demVotes });

            _totalVotes.append('text')
                .attr({
                    "class": "total-votes",
                    "text-anchor": "start",
                    "x": function(d) {
                        return width / 2 + sankey.nodes()[d.index * stateCount].repPos + 5;
                    },
                    "y": d => d.y,
                    "font-size": 17,
                    "font-weight": "normal",
                    "fill": sankey.repColor().darker(2)
                })
                .text(function(d) { return d.repVotes });
        }

        main.selectAll('.column').transition().style("opacity", 0);
    } else {
        svg.selectAll('.total-votes').transition().style("opacity", 0);
        main.selectAll('.column').transition().style("opacity", 1);
    }

}