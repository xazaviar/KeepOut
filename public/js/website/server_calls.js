function signUp(data, _callback){
    $.ajax({
        url: "/createNewUser",
        type:'POST',
        dataType: 'text',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(data){
            _callback(true, data);
        },
        error: function(xhr, status, error){
            _callback(false, xhr.responseText);
        }
    });
}

function signIn(data, _callback){
    $.ajax({
        url: "/signIn",
        type:'POST',
        dataType: 'text',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(data){
            _callback(true, data);
        },
        error: function(xhr, status, error){
            _callback(false, xhr.responseText);
        }
    });
}