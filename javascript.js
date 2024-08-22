const BLACK_PIECE_COLOR = "#0f0f0f"
const RED_PIECE_COLOR = "#fc2419"
const BOARD_SIZE = 8;
const colors = [ "red", "black" ]

game_board = create_board()
init_board(game_board)

function create_board()
{

    let mem_board    = get_empty_board()
    let visual_board = document.querySelector("#checker-board")
    
    visual_board.style.height = "80vmin"
    visual_board.style.width = visual_board.style.height 

    let tile_size = "height:" + 10 + "vmin; width: " + 10 + "vmin; "

            let tile_num = 0
    for (let i = 0; i < BOARD_SIZE; i++)
    {
        for (let j = 0; j < BOARD_SIZE; j++)
        {

            let background_color = "background-color: " + colors[(i + j ) % 2] + ";";



            let tile = document.createElement("div")
            tile.setAttribute("style", tile_size + background_color)
            tile.classList.add("tile") 

            if( ( i + j ) % 2 == 1) {
                mem_board[i][Math.floor(j / 2)][1] = tile; 
            }

            visual_board.appendChild(tile)
        }
    }
    return mem_board;
}



function create_piece(color, isPromoted)
{
    piece = document.createElement("div")
    piece.classList.add("piece")
    piece.style.backgroundColor = color

    if(isPromoted)
        piece.style.borderColor = "gold"

    return piece
}

//sets up a game of checkers
function init_board(board)
{
    for (let row = 0; row < 3; row++)
    {
        for (let j = 0; j < BOARD_SIZE / 2; j++)
        {

            //msb is is the piece is promoted, lsb is the colour of the piece.
            
            board[row][j][1].appendChild(create_piece(RED_PIECE_COLOR, false) )
            board[row][j][0] = 010

            
            board[BOARD_SIZE - row - 1][j][0] = 000
            board[BOARD_SIZE - row - 1][j][1].appendChild(create_piece(BLACK_PIECE_COLOR, false) )
        }
    }
}



//the first element of each "tile" in the 2d array is the type of tile that is on the tile
//and the second is the tile DOM object. This array only holds the black tiles. 
function get_empty_board()
{
    let mem_board = new Array(BOARD_SIZE)
    for (let i = 0; i < mem_board.length; i++)
    {
        mem_board[i] = new Array(BOARD_SIZE / 2)
        for (let j = 0; j < BOARD_SIZE / 2; j++)
            mem_board[i][j] = [undefined, undefined]
    }

    return mem_board;
}
