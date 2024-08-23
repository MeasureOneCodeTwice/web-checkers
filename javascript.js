const BLACK_PIECE_COLOR = "#0f0f0f"
const RED_PIECE_COLOR = "#fc2419"
const PIECE_BORDER_COLOR = "#323232"
const BOARD_SIZE = 8;
const BOARD_COLORS = [ "red", "black" ]

main()

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
            let background_color = "background-color: " + BOARD_COLORS[(i + j ) % 2] + ";";
            let tile = document.createElement("div")
            tile.setAttribute("style", tile_size + background_color)
            tile.classList.add("tile") 

            if( ( i + j ) % 2 == 1) {
                mem_board[i][Math.floor(j / 2)][0] = tile; 
                mem_board[i][Math.floor(j / 2)][1] = 0; 
                tile.dataset.row = i
                tile.dataset.col = Math.floor(j / 2)
            } else {
                tile.dataset.red = true 
            }

            visual_board.appendChild(tile)
        }
    }
    return [mem_board, visual_board];
}


function valid_move(game_board, origin, dest)
{
    //CASES
    //not jumping when jumping is manditory
    //moving a red or black piece one tile up or down respectively
    //jumping a piece of the opposite colour
    //chain jumping 
    //ending move on the end of the board (promote)

}

//EVENT HANDLER
//really wish i had pointers for this function.
function handle_click(e, game_board, selected_piece, selected_tile)
{
    selected_piece = set_selected_piece(e, selected_piece)
    if(selected_piece  != undefined)
        selected_tile = set_selected_tile(e, selected_tile)

     if(selected_piece != undefined && selected_tile != undefined)
     {
         move_piece(game_board, selected_piece, selected_tile)
         selected_tile = undefined
         selected_piece = undefined
     }

    return [ selected_piece, selected_tile ]
}

//EVENT HANDLER
//moves the pieces selected_piece to selected_tile (both are global vars)   
//removes the border indicating selected piece is selected, updates 
//game_board and sets both global vars to undefined.
function move_piece(game_board, selected_piece, selected_tile)
{
    let orig_row = selected_piece.parentNode.dataset.row
    let orig_col = selected_piece.parentNode.dataset.col

    let dest_row = selected_tile.dataset.row
    let dest_col = selected_tile.dataset.col

    selected_piece.parentNode.removeChild(selected_piece)
    selected_tile.appendChild(selected_piece)
    selected_piece.style.borderColor = PIECE_BORDER_COLOR

    game_board[orig_row][orig_col][1] = game_board[dest_row][dest_col][1]; 
}

//EVENT HANDLER
//if the global variable selected_tile is undefined and
//a tile was clicked on this function sets selected_tile to the
//tile that was clicked on. Otherwise it does nothing.
function set_selected_tile(e, selected_tile)
{
    //don't let them select a tile with a piece on it
    //or a red tile.
    if( e.target.firstChild == null && 
        e.target.classList.contains("tile") &&
        e.target.dataset.red != "true"
      ) {
        selected_tile = e.target
    }

    return selected_tile; 
}


//returns the tile that was clicked on (if a tile was clicked on)
function set_selected_piece(e, selected_piece)
{
    if(e.target.classList.contains("piece"))
    {
        //update the selected piece and set the previously selected piece back to unselected. 
        if(selected_piece != undefined)
            selected_piece.style.borderColor = PIECE_BORDER_COLOR

        if(selected_piece != e.target)
        {
            selected_piece = e.target
            selected_piece.style.borderColor = "white"
        } else {
            //clicked on the selected piece so, unselect it.
            selected_piece = undefined;
        }
    }

    return selected_piece
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
            let piece = create_piece(RED_PIECE_COLOR, false) 
            board[row][j][0].appendChild(piece)
            board[row][j][1] = 0000

            piece = create_piece(BLACK_PIECE_COLOR, false) 
            board[BOARD_SIZE - row - 1][j][0].appendChild(piece)
            board[BOARD_SIZE - row - 1][j][1] = 0001
        }
    }
}


//the first element of each entry in the 2d array is the tile.
//The second is information about the piece on the tile
// 0 a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
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

function main() {

    let selected_piece = undefined;
    let selected_tile   = undefined;

    let [ game_board, board_object ] = create_board()

    board_object.addEventListener("mousedown", (e) => {
        [ selected_piece, selected_tile ] = handle_click(e, game_board, selected_piece, selected_tile);
    })

    init_board(game_board)
}
