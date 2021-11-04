d3.sankey = function () {
    var sankey = {};
  
    d3.selection.prototype.moveToFront = function() {  
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };

    sankey.linkColor = function (_) {
        if (!arguments.length) return linkColor;
        linkColor = d3.rgb(_);
        return sankey;
    };
    
    sankey.demColor = function (_) {
        if (!arguments.length) return demColor;
        demColor = d3.rgb(_);
        return sankey;
    };

    sankey.repColor = function (_) {
        if (!arguments.length) return repColor;
        repColor = d3.rgb(_);
        return sankey;
    };

    sankey.nodeHeight = function (_) {
        if (!arguments.length) return nodeHeight;
        nodeHeight = +_;
        return sankey;
    };

    sankey.nodeUnitWidth = function (_) {
        if (!arguments.length) return nodeUnitWidth;
        nodeUnitWidth = +_;
        return sankey;
    };

    sankey.nodeUnit = function (_) {
        if (!arguments.length) return nodeUnit;
        nodeUnit = +_;
        return sankey;
    };

    sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.rowHeight = function (_) {
        if (!arguments.length) return rowHeight;
        rowHeight = +_;
        return sankey;
    };

    sankey.nodes = function (_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function (_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.highlights = function (_) {
        if (!arguments.length) return highlights;
        highlights = _;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    sankey.layout = function () {
        computeNodeLinks();
        computePosition(0);

        sankey.highlightLinks([]);

        return sankey;
    };

    sankey.relayout = function (type) {
        computePosition(type);
        return sankey;
    };

    sankey.parse = function (data, startYear, endYear, stateCount) {
        
        var nodes = [], links = [], highlights = [];

        var rowIndex = 0;
        for (var y = endYear; y >= startYear; y -= 4) {
            var _dem = "dem" + y,
                _rep = "rep" + y,
                _votes = "votes" + y;

            for (var i = 0; i < stateCount; i ++) {
                var record = data[i];
            
                // node
                var node = {};

                var id = i + stateCount * rowIndex;

                node["id"] = id;
                node["name"] = record["name"];
                node["class"] = rowIndex;
                node["value"] = node["votes"] = record[_votes];
                node["dem"] = record[_dem];
                node["rep"] = record[_rep];
                node["diff"] = record[_votes] != 0 ? (record[_dem] - record[_rep]) : 0;
                node["highlight"] = false;
        
                nodes.push(node);

                // link
                if (y == startYear) continue;

                var link = {};
                var _votesNext = "votes" + (y - 4);

                if (record[_votesNext]) {
                    link["id"] = id;
                    link["source"] = id;
                    link["target"] = id + stateCount;
                    link["highlight"] = false;

                    links.push(link);
                }
            }   

            rowIndex ++;
        }

        return {
            nodes: nodes,
            links: links,
            highlights: highlights
        };
    }

    sankey.link = function () {
        var curvature = .5;

        // x0 = line start X
        // y0 = line start Y

        // x1 = line end X
        // y1 = line end Y

        // y2 = control point 1 (Y pos)
        // y3 = control point 2 (Y pos)

        function link(d) {

            // big changes here obviously, more comments to follow
            var x0 = d.source.x,
                x1 = d.target.x,
                y0 = d.source.y + nodeHeight,
                y1 = d.target.y,
                yi = d3.interpolateNumber(y0, y1),
                y2 = yi(curvature),
                y3 = yi(1 - curvature);

            var width = d.dy, offY = 0;

            // correction
            if (d.dy < 3) {
                width = 3;
        
                if (d.dy == 2) {
                    x0 = x0 - 0.5;
                    x1 = x1 - 0.5;
                } else if (d.dy == 1) {
                    x0 = x0 - 1;
                    x1 = x1 - 1;
                }
            } 
        
            var diff = Math.abs(d.source.diff - d.target.diff);
            if (diff >= 20) {
                offY = 5;
            }

            var flag = x0 > x1 ? 1 : -1;

            // ToDo - nice to have - allow flow up or down! Plenty of use cases for starting at the bottom,
            // but main one is trickle down (economics, budgets etc), not up

            return "M" + x0 + "," + y0     // start (of SVG path)
                + "C" + x0 + "," + y2      // CP1 (curve control point)
                + " " + x1 + "," + y3      // CP2
                + " " + x1 + "," + y1     // end
            
                + "L" + (x1 + width) + "," + y1
                + "C" + (x1 + width) + "," + (y3 + flag * (width / 2 + offY))     // CP1 (curve control point)
                + " " + (x0 + width) + "," + (y2 + flag * (width / 2 + offY))      // CP2
                + " " + (x0 + width) + "," + y0     // end
        }

        link.curvature = function (_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.forEach(function (node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function (link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number") source = link.source = nodes[link.source];
            if (typeof target === "number") target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

    function computePosition(type = 0) {

        var nodesByBreadth = d3.nest()
            .key(function (d) { return d.class; })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function (d) { return d.values; });

        var _center = size[0] / 2;

        if (type == 0) {
            nodesByBreadth.forEach(function(_nodes) {
                _nodes.forEach(function (node) {
                    // color
                    node.color = node.diff >= 0 ? demColor : repColor;
    
                    // node width
                    node.dy = Math.ceil(node.value / nodeUnit) * nodeUnitWidth;
    
                    // y - pos
                    node.y = node.class * rowHeight;
    
                    // x - pos
                    if (node.diff >= 0) { // dem node
                        if (node.diff >= 50) {
                            node.x = 0;
                        } else {
                            node.x = _center - Math.floor((_center / 50) * node.diff) - node.dy / 2;
                        }
                    } else { // rep node
                        if (node.diff <= -50) {
                            node.x = size[0];
                        } else {
                            node.x = _center - Math.floor((_center / 50) * node.diff);
                        }
                    }
                });
            });
        } else if (type == 1) {
            nodesByBreadth.forEach(function(_nodes) {
                var demPos = 0, repPos = 0;
                var nodeInterval = 2;
                
                _nodes.sort(function(a, b) {
                    return a.diff - b.diff;
                })
                
                _nodes.forEach(function (node) {
                    // color
                    node.color = node.diff >= 0 ? demColor : repColor;
    
                    // node width
                    node.dy = Math.ceil(node.value / nodeUnit) * nodeUnitWidth;
    
                    // y - pos
                    node.y = node.class * rowHeight;
    
                    // x - pos
                    if (node.diff >= 0) { // dem node
                        node.x = _center - demPos - node.dy;
                        demPos += (node.dy + nodeInterval);
                    } else { // rep node
                        node.x = repPos;
                        repPos += (node.dy + nodeInterval);
                    }
                })

                _nodes.forEach(function (node) {
                    if (node.diff < 0) { // rep node
                        node.x = _center + (repPos - node.x - node.dy);
                    }
                });

                _nodes.sort(function(a, b){
                    return a.id - b.id;
                })

                _nodes[0].demPos = demPos;
                _nodes[0].repPos = repPos;
            });
        }
        
        links.forEach(function (link) {
            link.dy = link.source.dy;
        });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.forEach(function (node) {
            node.value = Math.max(
                d3.sum(node.sourceLinks, value),
                d3.sum(node.targetLinks, value)
            );
        });
    }

    sankey.highlightLinks = function(states = [], stateCount = 51) {
        highlights = [];

        links.forEach(function (link) {

            var highlight = false;
            if (states.length) {
                if (states.includes(link.source.id % stateCount)) {
                    highlight = true;
                }
            } else {
                if ((link.source.diff >= 0 && link.target.diff < 0) || (link.source.diff < 0 && link.target.diff >= 0)) {
                    highlight = true;
                }
            }

            if (highlight) {
                link.stroke = "url(#g_" + link.id + ")";
                link.highlight = true;

                highlights.push(link);
            } else {
                link.stroke = linkColor;
                link.highlight = false;
            }
        });
    }

    // take a grouping of the nodes - the vertical columns
    // there shouldnt be 8 - there wibreadthHeightll be more, the total number of 1st level sources
    // then iterate over them and give them an incrementing x
    // because the data structure is ALL nodes, just flattened, don't just apply at the top level
    // then everything should have an X
    // THEN, for the Y
    // do the same thing, this time on the grouping of 8! i.e. 8 different Y values, not loads of different ones!
    function computeNodeBreadths(iterations) {
        var nodesByBreadth = d3.nest()
            .key(function (d) { return d.class; })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function (d) { return d.values; }); // values! we are using the values also as a way to seperate nodes (not just stroke width)?

        // these relax methods should probably be operating on one level of the nodes, not all!?

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function (nodes, breadth) {
                nodes.forEach(function (node) {
                    if (node.targetLinks.length) {
                        var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                        node.x += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedSource(link) {
                return center(link.source) * link.value;
            }
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function (nodes) {
                nodes.forEach(function (node) {
                    if (node.sourceLinks.length) {
                        var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                        node.x += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedTarget(link) {
                return center(link.target) * link.value;
            }
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function (nodes) {
                var node,
                    dy,
                    x0 = 0,
                    n = nodes.length,
                    i;

                // Push any overlapping nodes right.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = x0 - node.x;
                    if (dy > 0) node.x += dy;
                    x0 = node.x + node.dy + nodePadding;
                }

                // If the rightmost node goes outside the bounds, push it left.
                dy = x0 - nodePadding - size[0]; // was size[1]
                if (dy > 0) {
                    x0 = node.x -= dy;

                    // Push any overlapping nodes left.
                    for (i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.x + node.dy + nodePadding - x0; // was y0
                        if (dy > 0) node.x -= dy;
                        x0 = node.x;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            //return a.y - b.y; // flows go up
            return b.x - a.x; // flows go down
            //return a.x - b.x;
        }
    }

    // this moves all end points (sinks!) to the most extreme bottom
    function moveSinksDown(y) {
        nodes.forEach(function (node) {
            if (!node.sourceLinks.length) {
                node.y = y - 1;
            }
        });
    }

    // shift their locations out to occupy the screen
    function scaleNodeBreadths(kx) {
        nodes.forEach(function (node) {
            node.y *= kx;
        });
    }

    function computeNodeDepths() {
        var remainingNodes = nodes,
            nextNodes,
            y = 0;

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node.y = y;
                //node.dx = nodeWidth;
                node.sourceLinks.forEach(function (link) {
                    if (nextNodes.indexOf(link.target) < 0) {
                        nextNodes.push(link.target);
                    }
                });
            });
            remainingNodes = nextNodes;
            ++y;
        }

        // move end points to the very bottom
        moveSinksDown(y);

        scaleNodeBreadths((size[1] - nodeWidth) / (y - 1));
    }

    // .ty is the offset in terms of node position of the link (target)
    function computeLinkDepths() {
    
        nodes.forEach(function (node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.forEach(function (node) {
            var sy = 0, ty = 0;
            //ty = node.dy;
            node.sourceLinks.forEach(function (link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function (link) {
                // this is simply saying, for each target, keep adding the width of the link
                // so what if it was the other way round. start with full width then subtract?
                link.ty = ty;
                ty += link.dy;
                //ty -= link.dy;
            });
        });

        function ascendingSourceDepth(a, b) {
            //return a.source.y - b.source.y;
            return a.source.x - b.source.x;
        }

        function ascendingTargetDepth(a, b) {
            //return a.target.y - b.target.y;
            return a.target.x - b.target.x;
        }
    }

    function center(node) {
        return node.y + node.dy / 2;
    }

    function value(link) {
        return link.value;
    }

    return sankey;
};