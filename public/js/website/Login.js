//Boot up
$(document).ready(function() {
    serviceWorkerSetup();

    $("button#signUp").on("click", function(event){
        event.preventDefault();
        $(".signUp").removeClass("hide").addClass("show").show();
        $(".titleScreen").fadeOut("fast",function(){});
    });

    $("button#signIn").on("click", function(event){
        event.preventDefault();
        $(".signIn").removeClass("hide").addClass("show").show();
        $(".titleScreen").fadeOut("fast",function(){});
    });

    $("#backArrow1").on("click", function(event){
        event.preventDefault();
        $(".signUp").removeClass("show").addClass("hide");
        $(".titleScreen").fadeIn("slow",function(){});
    });

    $("#backArrow2").on("click", function(event){
        event.preventDefault();
        $(".signIn").removeClass("show").addClass("hide");
        $(".titleScreen").fadeIn("slow",function(){});
    });

    //Sign up Form Submit
    $("form#signUp").on("submit", function(e){
        e.preventDefault();
        var pass1 = $("form#signUp input[name='password']").val(),
            pass2 = $("form#signUp input[name='pass_verify']").val();
        // console.log(pass1, pass2);

        // if (pass1!=pass2) {
        //     document.getElementById("password_confirmation").setCustomValidity('Passwords Must be Matching.');
        // } else {
        //     // input is valid -- reset the error message
        //     document.getElementById("password_confirmation").setCustomValidity('');

            var data = {
                name: $("form#signUp input[name='name']").val(),
                email: $("form#signUp input[name='email']").val(),
                password: pass1
            };

            signUp(data, function(success, res){
                if(success){
                    var resData = JSON.parse(res);

                    //Save credentials to local storage
                    window.localStorage.email = resData.email;
                    window.localStorage.password = resData.password;

                    //Redirect to the game page
                    window.location.assign(window.location+"./game");
                }
                else{
                    //Some kind of error messaging here
                    console.log(res);
                }

            });
        // }
    });

    //Sign In Form Submit
    $("form#signIn").on("submit", function(e){
        e.preventDefault();

        var data = {
            email: $("form#signIn input[name='email']").val(),
            password: $("form#signIn input[name='password']").val()
        };
        
        signIn(data, function(success, res){
            if(success){
                var resData = JSON.parse(res);

                //Save credentials to local storage
                window.localStorage.email = resData.email;
                window.localStorage.password = resData.password;

                //Redirect to the game page
                window.location.assign(window.location+"./game");
            }
            else{
                //Some kind of error messaging here
                console.log(res);
            }
        });
    });
});

function serviceWorkerSetup(){
    if("serviceWorker" in navigator){
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/service-worker.js")
                .then((reg) => {
                    console.log("Service worker registered.", reg);
                });
        });
    }
}