templates = {};
compiledTemplates = {};

// templates must remain a globally accessible object - don't create another global variable called "templates"!!
// same goes for compiledTemplates. compiledTemplates is filled a runtime, don't bother putting anything in there manually.

/*
templates.user_list = [
    '<div class="user_list">',
        '<div class="list-group">',
            '<% for(let i = 0; i < users.length; i++) { %>',
                '<a href="#" class="list-group-item user_list_item" data-user-id="<%= users[i].id %>">',
                    '<%= users[i].id %>',
                '</li>',
            '<% } %>', // /for
        '</ul>',
    '</div>'
].join('\n');
*/
