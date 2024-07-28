// import * as d3 from "./d3.v7.min.js";
console.log("Starting JS");

const data = (await d3.csv("gpa_by_year.csv")).filter((ele) => {
  if (ele["Year"] === "2024") {
    return false;
  }
  return true;
});

const academic_units_color = {
  "Grainger": "#f59e0b",
  "LAS": "#84cc16",
  "FAA": "#06b6d4",
  "Education": "#3b82f6",
  "Gies": "#a855f7",
  "ACES": "#f43f5e",
  "Other": "#a21caf",
  "iSchool": "#0369a1",
  "Media": "#047857",
  "Applied Health Sciences": "#854d0e",
  "LER": "#991b1b",
  "Vet Med": "#fda4af",
};

function get_gradepoints(course) {
  let value = 0;
  value += course["A+"] * 12 / 3;
  value += course["A"] * 12 / 3;
  value += course["A-"] * 11 / 3;
  value += course["B+"] * 10 / 3;
  value += course["B"] * 9 / 3;
  value += course["B-"] * 8 / 3;
  value += course["C+"] * 7 / 3;
  value += course["C"] * 6 / 3;
  value += course["C-"] * 5 / 3;
  value += course["D+"] * 4 / 3;
  value += course["D"] * 3 / 3;
  value += course["D-"] * 2 / 3;
  value += course["F"] * 0 / 3;
  return value;
}

function create_averages0() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  let svg = d3.select("svg#first-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));

    const pathLength = d3.select("path#" + key.replace(/\s/g, "")).node().getTotalLength();

    d3.select("path#" + key.replace(/\s/g, ""))
      .interrupt()
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
    // .transition()
    // .ease(d3.easeSin)
    // .delay(2000)
    // .duration(4500)
    // .attr("stroke-dashoffset", 0);
  }

  document.querySelector("#first-svg").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("#first-svg").parentNode.children[1]
    .setAttribute("opacity", "0");

  d3.select("#avgs")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#" + key.replace(/\s/g, "")).node().getTotalLength();

        d3.select("path#" + key.replace(/\s/g, ""))
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(4500)
          .attr("stroke-dashoffset", 0);

      }

    })

  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target.parentNode.children[0].setAttribute("opacity", "100")
          entry.target.parentNode.children[1].setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("#avgs");
            button["__on"][0].listener();
          }, 1200);

        }
      }
    });
  });
  observer.observe(document.querySelector('#first-svg'));
}

function create_averages1() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key != "Grainger" && key != "LAS" && key != "Gies") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  let svg = d3.select("svg#first-svg1")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", "avg1" + key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));

    const pathLength = d3.select("path#avg1" + key.replace(/\s/g, "")).node().getTotalLength();

    d3.select("path#avg1" + key.replace(/\s/g, ""))
      .interrupt()
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
      .transition()
      .ease(d3.easeSin)
      .delay(2000)
      .duration(4500)
      .attr("stroke-dashoffset", 0);
  }


}

function create_lowest() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes
    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gpa = [];
      }
      let cur_gpa = get_gradepoints(academic_units[key][i]) / academic_units[key][i]["Num Students"];
      year_stats[year].gpa.push(cur_gpa);
    }
    for (let year in year_stats) {
      let cur = year_stats[year].gpa.sort()[0];
      year_stats[year].gpa = cur;
      if (cur < min_gpa) {
        min_gpa = cur;
      }
      if (cur > max_gpa) {
        max_gpa = cur;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa)); // sort and take the min ele


  let svg = d3.select("svg#second-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Minimum Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));
  }
}

function create_units_streamgraph() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let unit in yearly_academic_units) {
    for (let year in yearly_academic_units[unit]) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let normalized = gradepoints / students; // normalize with respect to all units
      flattenedData.push({
        year: year,
        unit: unit,
        gpps: normalized,
      })
    }
  }

  // renormalize by subtracting off the minumum each year
  for (let year in yearly_academic_units["Grainger"]) {
    let min = 4;
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year && flattenedData[i].gpps < min) {
        min = flattenedData[i].gpps;
      }
    }
    // subtract off min
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year) {
        flattenedData[i].gpps += (0.075 - min);
      }
    }

  }

  // Determine the series that need to be stacked.
  const series = d3.stack()
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)
    .keys(d3.union(flattenedData.map(d => d.unit))) // distinct series keys, in input order
    .value(([, D], key) => D.get(key).gpps) // get value for each series key and stack
    (d3.index(flattenedData, d => d.year, d => d.unit)); // group by stack then series key

  // Prepare the scales for positional and color encodings.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    // .domain(d3.extent(series.flat(2)))
    .domain([d3.min(series.flat(2), (d) => d) - 1.1, d3.max(series.flat(2), (d) => d) + 1.1])
    .rangeRound([height - marginBottom, marginTop]);

  // Construct an area shape.
  const area = d3.area()
    .x(d => x(new Date(d.data[0])))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  let svg = d3.select("svg#third-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 20).tickFormat((d) => Math.abs(d).toLocaleString("en-US")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ Unemployed persons"));

  // Append the x-axis and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.select(".domain").remove());

  // Append a path for each series.
  svg.append("g")
    .selectAll()
    .data(series)
    .join("path")
    .attr("fill", d => academic_units_color[d.key])
    // .attr("fill", d => color(d.key))
    .attr("d", area)
    .append("title")
    .text(d => d.key);
}

function create_overall_barchart() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(Number(cur_gradepoints));
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let year in yearly_academic_units["Grainger"]) {
    let total_gradepoints = 0;
    let total_students = 0;
    for (let unit in yearly_academic_units) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      total_gradepoints += gradepoints;
      total_students += students;
    }
    let gpa = total_gradepoints / total_students;
    flattenedData.push({
      year: year,
      gpa: gpa,
    })
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear()
    .domain([d3.min(flattenedData, (d) => d.gpa) - 0.03, d3.max(flattenedData, (d) => d.gpa) + 0.03])
    .range([height - marginBottom, marginTop]);

  let svg = d3.select("svg#fourth-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis and label.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickFormat((y) => y))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ Frequency (%)"));

  // Add a rect for each bar.
  svg.append("g")
    .attr("fill", "steelblue")
    .selectAll()
    .data(flattenedData)
    .join("rect")
    .attr("x", (d) => x(new Date(d.year)))
    .attr("y", (d) => y(d.gpa))
    .attr("height", (d) => y(d3.min(flattenedData, (d) => d.gpa) - 0.03) - y(d.gpa))
    .attr("width", 20)
    .attr("id", (d) => "bar-" + d.year)
    .on("mouseenter", (e, d) => {
      // let x = e.clientX;
      // let y = e.clientY;
      let rect = document.getElementById("bar-" + d.year).getBoundingClientRect();

      d3.select("#tooltip")
        .style("left", (rect.x - 0) + "px")
        .style("top", (rect.y - 30) + "px")
        .style("visibility", "visible")
        .html("<p>" + Math.round(d.gpa * 1000) / 1000 + "</p>");

    })
    .on("mouseleave", (e, d) => {
      d3.select("#tooltip")
        .style("visibility", "hidden");
    })
    .on("mousemove", (e, d) => {
      // let tooltip = document.getElementById("tooltip");
      // tooltip.style.left = e.clientX + "px";
      // tooltip.style.top = e.clientY + "px";
    });
}

function createLegends() {
  const width = 928;
  const height = 100;
  const cols = 4;
  const entryWidth = 240;
  const entryHeight = 20;
  const marginTop = 30;
  const marginLeft = 40;

  const legendRadius = 8;

  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  function addToSvg(svg) {
    let i = 0;
    for (let key in academic_units) {
      if (key == "Other") { continue; }
      let row = i / cols;
      let col = i % cols;

      svg.append("circle")
        .attr("cx", entryWidth * col + marginLeft)
        .attr("cy", row * entryHeight - legendRadius * 0.7 + marginTop)
        .attr("r", legendRadius)
        .style("fill", academic_units_color[key]);
      svg.append("text")
        .attr("x", entryWidth * col + 30 + marginLeft)
        .attr("y", row * entryHeight + marginTop)
        .text(key)
        .style("font-size", "15px")
        .attr("fill", "currentColor")
      i += 1;
    }
  }

  let first = d3.select("svg#first-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(first);

  let second = d3.select("svg#second-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(second);

  let third = d3.select("svg#third-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(third);

  let fourth = d3.select("svg#fourth-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(fourth);

  let fifth = d3.select("svg#fifth-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(fifth);

}



createLegends();
create_averages0();
create_averages1();
create_lowest();
create_units_streamgraph();
create_overall_barchart();


