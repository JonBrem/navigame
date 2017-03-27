templates.marker_controls = 
       ['<div id="controls-section">',
        '   <div class="row" style="height: 100%">',
        '       <div class="small-6 columns new_marker_container">',
        '           <div>',
        '              <span class="new_marker_droppable"><img id="marker_droppable_img" src="' + WEBROOT + '/res/marker.png" width="12" height="12" /></span>',
        '           </div>',
        '           <div style="margin-left: auto; margin-right: auto; text-align: center">',
        '              Marker hinzufügen',
        '           </div>',
        '       </div>',
        '       <div class="small-6 columns" id="marker_fill_rest">',
        '           <div class="row" style="margin-left: 0">',
        '               <div class="small-6 columns marker_controls_button_container">',
        '                   <button type="button" class="button marker-edit-button disabled"><i class="fi-pencil"></i> Edit</button>',
        '               </div>',
        '               <div class="small-6 columns marker_controls_button_container">',
        '                   <button type="button" class="alert button marker-delete-button disabled"><i class="fi-trash"></i> Delete</button>',
        '               </div>',
        '           </div>',
        '       </div>',
        '   </div>',
        '</div>'].join('\n');

templates.marker_selected_detail = 
    [].join('\n');
