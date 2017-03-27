templates.new_game_dialog = 
   ['<div class="reveal" id="new_game_modal">',
    '   <h1>Neues Spiel</h1>',
    '   <div id="new_game_load">&nbsp;</div>',
    '   <div><button id="new_game_start_button" class="button">Starten</button></div>',
    '   <div><input type="text" id="session_input" placeholder="Session-id laden" /></div>',
    '   <% if (data.closeable) { %>',
    '   <button class="close-button" data-close aria-label="Close modal" type="button">',
    '        <span aria-hidden="true">&times;</span>',
    '   </button>',
    '   <% } %>',
    '</div>'].join('\n');