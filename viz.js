(function(d3) {
  "use strict";

  function fixDOMInconsistency() {
    NodeList.prototype.map = Array.prototype.map;
  }

  function toPipeline(pipeline) {
    var materials = pipeline.querySelectorAll('materials *').map(toMaterial);
    return new Pipeline(pipeline.getAttribute('name'), materials);
  }

  function toMaterial(material) {
    return new Material(material);
  }

  function Material(material) {
    this.material = material;
  }

  function PipelineGroup(name, pipelines) {
    this.name = name;
    this.pipelines = pipelines;
  }

  function Pipeline(name, materials) {
    this.name = name;
    this.materials = materials;
  }

  function parse(xml) {
    return xml.querySelectorAll('cruise > pipelines')
      .map(function(pipelineGroup) {
        var pipelines = pipelineGroup.querySelectorAll('pipelines > pipeline').map(toPipeline);
        return new PipelineGroup(pipelineGroup.getAttribute('group'), pipelines);
      });
  }

  function renderConfig(xml) {
    var pipelineGroups = parse(xml);
    var groupColors = d3.scale.category10();
    var canvasSelector = '#canvas';
    var canvasPadding = 10,
        pipelineGroupHeight = 100,
        pipelineWidth = 130,
        pipelineHeight = 50,
        canvasWidth = 4000;

    d3.select(canvasSelector + ' > *').remove();
    var canvas = d3.select(canvasSelector).append('svg:svg')
                   .attr('width', canvasWidth)
                   .attr('height', pipelineGroups.length * (pipelineGroupHeight+canvasPadding));

    var groups = canvas.selectAll('.pipeline-group')
          .data(pipelineGroups)
            .enter().append('svg:g')
              .attr('id', function(group) { return 'group-' + group.name; })
              .classed('pipeline-group', true)
              .attr('transform', function(group, i) {
                var y = canvasPadding + i * (pipelineGroupHeight + canvasPadding);
                return 'translate('+ canvasPadding +','+ y +')';
              })
    groups.append('svg:rect')
          .attr('fill', function(group) { return groupColors(group.name); })
          .attr('width', canvasWidth - 2*canvasPadding)
          .attr('height', pipelineGroupHeight);
    groups.append('svg:title')
          .text(function(group) { return group.name; });
    groups.append('svg:text')
          .attr('x', canvasPadding)
          .attr('y', function(group, i) { return 2*canvasPadding; })
          .text(function(group) { return group.name; });

    var pipelines = groups.selectAll('.pipeline')
      .data(function(group) { return group.pipelines; })
      .enter().append('svg:g')
        .classed('pipeline', true)
        .attr('transform', function(p, pi) {
          var x = canvasPadding + pi * (pipelineWidth + canvasPadding),
              y = 35;
          return 'translate('+ x +','+ y +')';
        })
    pipelines.append('svg:rect')
      .attr('fill', 'lightgreen')
      .attr('stroke', 'black')
      .attr('width', pipelineWidth)
      .attr('height', pipelineHeight)
    pipelines.append('svg:title')
      .text(function(pipeline) { return pipeline.name; })
    pipelines.append('svg:text')
      .attr('x', 10)
      .attr('y', 20)
      .text(function(pipeline) { return pipeline.name; })
  }

  function main() {
    fixDOMInconsistency();

    d3.select('#canvas')
      .on('dragover', function() { this.classList.add('drag-started'); return false; })
      .on('dragend', function() { this.classList.remove('drag-started'); return false; })
      .on('drop', function() {
        var e = d3.event;
        var file   = e.dataTransfer.files[0],
            reader = new FileReader();

        this.classList.remove('drag-started');

        reader.onload = function (event) {
          var xmlString = event.target.result;
          var xmlParser = new DOMParser();

          renderConfig(xmlParser.parseFromString(xmlString, 'text/xml'));
        };

        reader.readAsText(file);

        e.preventDefault();
        return false;
      });
  }

  main();

})(d3);

