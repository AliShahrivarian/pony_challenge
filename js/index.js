// $(document).ready(()=>{
//     let domokunMaze = new DomokunMaze(15,15,'Rainbow Dash',0,false)
//     domokunMaze.startGame();
// });

function removeButtons(){
    $('.buttonsPlace').addClass('hide');
}

function playWanderingMode(){
    removeButtons();
    let domokunMaze = new DomokunMaze(15,15,'Rainbow Dash',0,false)
    domokunMaze.startGame();
}
function playSearchForPath(){
    removeButtons();
    let domokunMaze = new DomokunMaze_v2(15,15,'Rainbow Dash',0)
    domokunMaze.startGame();
}