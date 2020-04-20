var backColor = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)}, 
    colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
var balls = [];
var HEIGHT = window.innerHeight, WIDTH = window.innerWidth;
var ballSize = 0, ballClickScale = 1.6;

//Boot up
$(document).ready(function() {
    //Create background balls
    for(var b = 0; b < 4; b++){
        var ball = new Ball("sender", "ball_id_"+b, "NORMAL", WIDTH, HEIGHT);
        balls.push(ball);
        $("body").append('<div class="ballClick" id="'+ball.auth+'"><div class="ball '+ball.type+'"></div></div>');
        $('.ballClick#'+ball.auth).css({"left":ball.x,"top":ball.y});
    }
    drawBackground();
    setInterval(drawBackground,20);


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


function drawBackground(){
    resize();

	//background coloring
    const inc = .5;

    if( backColor.r == colorGoal.r && 
        backColor.g == colorGoal.g && 
        backColor.b == colorGoal.b){
        colorGoal = {r:parseInt(Math.random()*255),g:parseInt(Math.random()*255),b:parseInt(Math.random()*255)};
    }

    if(colorGoal.r > backColor.r) backColor.r+=inc;
    else if(colorGoal.r < backColor.r) backColor.r-=inc;

    if(colorGoal.g > backColor.g) backColor.g+=inc;
    else if(colorGoal.g < backColor.g) backColor.g-=inc;

    if(colorGoal.b > backColor.b) backColor.b+=inc;
    else if(colorGoal.b < backColor.b) backColor.b-=inc;

    $("body").css("background-color","rgb("+backColor.r+","+backColor.g+","+backColor.b+")");
    $("button").css("color","white");
    $("button:hover").css("color","rgb("+backColor.r+","+backColor.g+","+backColor.b+")");

    //Background balls
    var margin = ballSize*(ballClickScale-1)/2;
    for(var b in balls){
        //Move balls
        balls[b].move();
        balls[b].bounce2(WIDTH, HEIGHT, ballSize, margin);

        //Update ball
        $('.ballClick#'+balls[b].auth).css({"left":balls[b].x,"top":balls[b].y});
    }
}

function resize(){
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    //Resize title
    // var tSize = ""+Math.min(Math.max(40,this.WIDTH*.10),100)+"pt";
    // $(".title").css("font-size",tSize);

    //Resize balls
    ballSize = Math.min(Math.max(25,WIDTH*.05),60);
    var margin = ballSize*(ballClickScale-1)/2;
    $(".ball").css({"width":ballSize+"px","height":ballSize+"px","margin":margin+"px 0 0 "+margin+"px"});
    $(".ballClick").css({"width":ballSize*ballClickScale+"px","height":ballSize*ballClickScale+"px"});
}