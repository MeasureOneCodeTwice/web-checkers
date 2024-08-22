const BOARD_SIZE = 8;
const colors = [ "red", "black" ]

create_board()
function create_board()
{

    let mem_board    = get_empty_board()
    let visual_board = document.querySelector("#checker-board")
    
    visual_board.style.height = "80vmin"
    visual_board.style.width = visual_board.style.height 

    let tile_size = "height:" + 10 + "vmin; width: " + 10 + "vmin; "

    for (let i = 0; i < BOARD_SIZE; i++)
    {
        for (let j = 0; j < BOARD_SIZE; j++)
        {

            let tile = document.createElement("div")
            mem_board[j][i][1] = tile; 

            let background_color = "background-color: " + colors[(i + j ) % 2] + ";";
            tile.setAttribute("style", tile_size + background_color)
            tile.classList.add("tile") 
            visual_board.appendChild(tile)

        }
    }
}


//the first element of each "tile" in the 2d array is the type of tile that is on the tile
//and the second is the tile DOM object 
function get_empty_board()
{
    let mem_board = new Array(BOARD_SIZE)
    for (let i = 0; i < mem_board.length; i++)
    {
        mem_board[i] = new Array(BOARD_SIZE)
        for (let j = 0; j < BOARD_SIZE; j++)
            mem_board[i][j] = [undefined, undefined]
    }

    return mem_board;
}

function screen_tall()
{
    return document.documentElement.clientHeight > document.documentElement.clientWidth;
}
