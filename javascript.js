const BLACK_PIECE_COLOR = "#2f2f2f"
const RED_PIECE_COLOR = "#fc2419"
const BLACK_PIECE_BORDER_COLOR = "#5f5f5f"
const RED_PIECE_BORDER_COLOR = "#553535"
const BOARD_SIZE = 8;
const BOARD_COLORS = [ "red", "black" ]

main()

function create_board()
{

    let mem_board    = get_empty_board()
    let visual_board = document.querySelector("#checker-board")
    
    visual_board.style.height = "80vmin"
    visual_board.style.width = visual_board.style.height 

    let tile_size = "height:" + (80 / BOARD_SIZE) + "vmin; width: " + (80 / BOARD_SIZE) + "vmin; "

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



//EVENT HANDLER
//really wish i had pointers for this function.
function handle_click(e, game_board, selected_piece, selected_tile)
{
    //the selected piece will be changed (or not) based on the target of the event
    selected_piece = set_selected_piece(e, selected_piece)
    if(selected_piece != undefined)
        selected_tile = set_selected_tile(e, selected_tile)

     if(selected_piece != undefined && selected_tile != undefined)
     {
         move_piece(game_board, selected_piece, selected_tile)
         selected_tile = undefined
         selected_piece = undefined
     }

    return [ selected_piece, selected_tile ]

}

function adjacent_columns(pos)
{
    return pos[0] % 2 == 0 ? [ pos[1], +pos[1] + 1 ] : [ pos[1] - 1, pos[1] ]
}

//checks if a move is a valid non-jump move.
function valid_non_skip(game_board, origin, dest)
{
    // 0 a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
    let orig_full = (game_board[origin[0]][origin[1]][1] & 0b0100) > 0;
    let dest_full = (game_board[dest[0]][dest[1]][1] & 0b0100) > 0;
    if(!orig_full || dest_full)
    {
        return false;
    }


    let black_piece = (game_board[origin[0]][origin[1]][1] & 0b0010) > 0
    let is_promoted = (game_board[origin[0]][origin[1]][1] & 0b0001) > 0

    let valid_rows 
    if(is_promoted)
        valid_rows = [ +origin[0] - 1, +origin[0] + 1 ]
    else 
        valid_rows = [ +origin[0] + 1 - ( 2 * black_piece) ]

    //determine which colmuns the piece can move to.
    let valid_cols = adjacent_columns(origin)


    let is_valid_row = exists_matching_move(dest[0], valid_rows);
    let is_valid_col = exists_matching_move(dest[1], valid_cols);

    //make sure the column and row fit on the board
    let off_board = false;
    off_board = off_board || dest[0] < 0 || dest[0] > game_board.length - 1
    off_board = off_board || dest[1] < 0 || dest[1] > game_board[0].length - 1

    return is_valid_col && is_valid_row && !off_board
}

//checks if a move is a valid single skip
function valid_skip(game_board, origin, dest)
{
    // 0b a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
    let black_piece =  (game_board[origin[0]][origin[1]][1] & 0b010) > 0
    let is_promoted =  (game_board[origin[0]][origin[1]][1] & 0b001) > 0

    let valid_cols = [+origin[1] + 1, +origin[1] - 1]
    let valid_rows
    if(is_promoted) 
        valid_rows = [ +origin[0] + 2, origin[0] - 2 ]
    else 
        valid_rows = [ +origin[0] + 2 - (4 * black_piece)]

    let is_valid_row    = exists_matching_move(dest[0], valid_rows);
    let is_valid_col    = exists_matching_move(dest[1], valid_cols);

    //make sure the column and row fit on the board
    let off_board = false;
    off_board = off_board || dest[0] < 0 || dest[0] > game_board.length - 1
    off_board = off_board || dest[1] < 0 || dest[1] > game_board[0].length - 1

    if(!is_valid_row || !is_valid_col || off_board)
        return [ false, undefined ]


    //check the tile we are jumping over has a piece of the opposite colour
    let hor_dir = (dest[1] - origin[1]) / Math.abs(dest[1] - origin[1])
    let possible_cols = adjacent_columns(origin)
    let jumped_col = possible_cols[ +(hor_dir > 0) ] 

    let ver_dir = (dest[0] - origin[0]) / Math.abs(dest[0] - origin[0])
    let jumped_tile_coords = [+origin[0] + +ver_dir, jumped_col] 

    let jumped_tile = game_board[jumped_tile_coords[0]][jumped_tile_coords[1]][1]
    let jumping_tile = game_board[origin[0]][origin[1]][1]

    //checking if the there is a piece on the jumped tile && the piece on the jumped tile is not the same colour.
    jumping_valid_tile = (jumped_tile & 0b0100) > 0 && (jumped_tile & 0b0010) != (jumping_tile & 0b0010)

    return [ jumping_valid_tile, jumped_tile_coords ]    
}

function exists_matching_move(testing, valid_choices)
{
    for (let i = 0; i < valid_choices.length; i++) {
        if(testing == valid_choices[i]) {
            return true;
        }
    }
    return false;
}

//checks if a move is valid and returns an array.
//the first element is if the move is valid. 
//the second is the tile that was skipped over if the move
//was a skip
function is_valid_move(game_board, origin, dest)
{
    if(valid_non_skip(game_board, origin, dest)) {
        return [ true, undefined]
    } else {
        return valid_skip(game_board, origin, dest)
    }
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

    let [ valid, jumped ] = is_valid_move( game_board, [ orig_row, orig_col ], [dest_row, dest_col ]) 

    //change the border color of the piece to unselected.
    if(!valid)
    {
        selected_piece.style.borderColor = selected_piece.dataset.appropriateBorderColor 
        return
    }

    //update the board.
    selected_piece.parentNode.removeChild(selected_piece)
    selected_tile.appendChild(selected_piece)

    game_board[dest_row][dest_col][1] = game_board[orig_row][orig_col][1]; 
    game_board[orig_row][orig_col][1] = 0b0000;

    //end of board, should promote to king.
    if(dest_row == 0 || dest_row == BOARD_SIZE - 1)
    {
        game_board[dest_row][dest_col][1] = game_board[dest_row][dest_col][1] | 0b0001 
        game_board[dest_row][dest_col][0].firstChild.dataset.appropriateBorderColor = "gold"
    }

    //remove the piece that was jumped
    if(valid && jumped != undefined)
    {
        let jumped_tile = game_board[ jumped[0] ][ jumped[1] ]
        jumped_tile[0].removeChild(jumped_tile[0].firstChild)
        jumped_tile[1] = 0b0000
    }

    selected_piece.style.borderColor = selected_piece.dataset.appropriateBorderColor 
}

//EVENT HANDLER
//if the global variable selected_tile is undefined and
//a tile was clicked on this function sets selected_tile to the
//tile that was clicked on. Otherwise it does nothing.
function set_selected_tile(e, selected_tile)
{
    //don't let the player select a tile with a piece on it or a red tile.
    if( e.target.firstChild == null && 
        e.target.classList.contains("tile") &&
        e.target.dataset.red != "true"
       ) selected_tile = e.target

    return selected_tile; 
}


//returns the tile that was clicked on (if a tile was clicked on)
function set_selected_piece(e, selected_piece)
{
    //do not change the selected piece 
    if(!e.target.classList.contains("piece"))
        return selected_piece

    //update the selected piece and set the previously selected piece back to unselected. 
    if(selected_piece != undefined)
        selected_piece.style.borderColor = selected_piece.dataset.appropriateBorderColor

    if(selected_piece != e.target)
    {
        selected_piece = e.target
        selected_piece.style.borderColor = "white"
    } else {
        //clicked on the selected piece so, unselect it.
        selected_piece = undefined;
    }

    return selected_piece
}

function create_piece(color)
{
    piece = document.createElement("div")
    piece.classList.add("piece")
    piece.style.backgroundColor = color

    if(color == RED_PIECE_COLOR)
        piece.dataset.appropriateBorderColor = RED_PIECE_BORDER_COLOR 
    else
        piece.dataset.appropriateBorderColor = BLACK_PIECE_BORDER_COLOR 

    piece.style.borderColor = piece.dataset.appropriateBorderColor 

    return piece
}

//sets up a game of checkers
// 0b 0 a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
function init_board(board)
{
    for (let row = 0; row < 3; row++) {
        for (let j = 0; j < BOARD_SIZE / 2; j++) {

            let piece = create_piece(RED_PIECE_COLOR) 
            board[row][j][0].appendChild(piece)
            board[row][j][1] = 0b0100

            piece = create_piece(BLACK_PIECE_COLOR) 
            board[BOARD_SIZE - row - 1][j][0].appendChild(piece)
            board[BOARD_SIZE - row - 1][j][1] = 0b0110
        }
    }
}


//the first element of each entry in the 2d array is the tile.
//The second is information about the piece on the tile
function get_empty_board()
{
    let board = new Array(BOARD_SIZE)
    for (let i = 0; i < board.length; i++)
    {
        board[i] = new Array(BOARD_SIZE / 2)
        for (let j = 0; j < BOARD_SIZE / 2; j++)
            board[i][j] = [undefined, undefined]
    }

    return board;
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
