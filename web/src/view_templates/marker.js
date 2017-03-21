templates.marker_controls = 
       ['<div class="card small-12 columns" id="controls-section">',
        '   <div class="card-divider">',
        '       Controls',
        '   </div>',
        '   <div class="card-section row">',
        '       <div class="small-2 columns new_marker_container">',
        '           <div>',
        '              <span class="new_marker_droppable">Marker</span>',
        '           </div>',
        '       </div>',
        '       <div class="small-10 columns" id="marker_fill_rest">',
        '           &nbsp;',
        '       </div>',
        '   </div>',
        '</div>'].join('\n');

templates.marker_selected_detail = 
    ['<div class="row">',
        '<div class="small-2 columns">',
            '<button type="button" class="button marker-edit-button"><i class="fi-pencil"></i> Edit</button>',
        '</div>',
        '<div class="small-2 columns">',
            '<button type="button" class="alert button marker-delete-button"><i class="fi-trash"></i> Delete</button>',
        '</div>',
     '</div>'].join('\n');
