$(document).ready(function(){
    $('#login-btn').click(function(){
        $(this).removeClass(`button-inactive`).addClass('button-active');
        $(`#register-btn`).removeClass(`button-active`).addClass(`button-inactive`)

        $(`.login-box`).show().css('display', 'block');
        $(`.register-box`).hide();
        $('#word-day').text("Log in account here, don't have account? Head over to register")
    });
    

    $('#register-btn').click(function(){
        $(this).removeClass(`button-inactive`).addClass('button-active');
        $(`#login-btn`).removeClass(`button-active`).addClass(`button-inactive`);

        $('#word-day').text("Your password will be encrypted!")
        $(`.register-box`).show().css('display', 'block');
        $(`.login-box`).hide();
    });
})

$(Document).ready(function(){
        $(`.navigation-more`).click(function(){
            $(`.slider-bar`).toggleClass(`active`); 
            $(`.fa-bars`).toggleClass(`rotate`);
        })
})

$(document).ready(function(){
    function updateTime() {
        const timezoneData = $('#timezone').data('timezone');
        const Timezone = parseInt(timezoneData.split(':')[0]);
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const gmt8 = new Date(utc + (3600000 * Timezone));
        const hours = gmt8.getHours().toString().padStart(2, '0');
        const minutes = gmt8.getMinutes().toString().padStart(2, '0');
        if (hours<12){
            var Clock = {
                indicator: ".AM",
                timeString: `${hours}:${minutes}`
            }
        }
        else{
            var Clock = {
                indicator: ".PM",
                timeString: `${hours-12}:${minutes}`
            }
        }
        $('.time h3').text(Clock.timeString + Clock.indicator)
    }

    function checkWidth(){
        if ($(window).width()<=800){
            $('.navigation-more').removeClass('slider-inactive');
        }
        else{
            $('.navigation-more').addClass('slider-inactive');
        }
    }
    checkWidth();
    $(window).resize(function(){
        checkWidth();
    })
    setInterval(updateTime, 1000);
})


$(document).ready(function () {
    // Show the popup form on overlay click
    $(".hover-overlay").on("click", function () {
        $(".popup-form-container").removeClass("hidden").fadeIn();
    });

    // Hide the popup form when clicking the cancel button
    $("#cancel-button").on("click", function () {
        $(".popup-form-container").fadeOut().addClass("hidden");
    });

    $("#new-profile-picture").on("change", function () {
        const file = this.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                $("#Preview").attr("src", e.target.result); // Update image src with preview
            };

            reader.readAsDataURL(file); // Convert the file to a data URL
        } else {
            $("#Preview").attr("src", "image/Test.jpg"); // Reset to default if no file
        }
    });

});
