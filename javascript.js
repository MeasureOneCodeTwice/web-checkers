const BLACK_PIECE_COLOR = "#2F2F2F"
const RED_PIECE_COLOR = "#FC2419"
const BLACK_PIECE_BORDER_COLOR = "#5f5f5f"
const RED_PIECE_BORDER_COLOR = "#553535"
const FORCE_JUMP_HIGHLIGHT_COLOR = "gold"
const BOARD_SIZE = 8;
const BOARD_COLORS = [ "red", "black" ]
const BOARD_PERCENT_OF_SCREEN = 80 //what percent of the screen should the board fit to

main()

function create_tile(color)
{
    let tile_size = "height:" + (BOARD_PERCENT_OF_SCREEN  / BOARD_SIZE) +
        "vmin; width: " + (BOARD_PERCENT_OF_SCREEN / BOARD_SIZE) + "vmin; "
    let tile = document.createElement("div")
    tile.setAttribute("style", tile_size + "background-color: " + color)
    return tile
}

function create_board()
{

    let board_array    = get_empty_board()
    let board_object = document.querySelector("#checker-board")
    
    board_object.style.height = "80vmin"
    board_object.style.width = board_object.style.height 


    //populate the board_object DOM element with tile children
    //and fill the board_array to reflect the board's state.
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {

            let tile = create_tile(BOARD_COLORS[(i + j ) % 2])
            tile.classList.add("tile") 

            //we only fill the array with the black tiles as they 
            //are the ones checkers is played on
            if( ( i + j ) % 2 == 1) {
                board_array[i][Math.floor(j / 2)][0] = tile; 
                board_array[i][Math.floor(j / 2)][1] = empty_tile_info()

                tile.dataset.row = i
                tile.dataset.col = Math.floor(j / 2)
            } else {
                tile.dataset.red = true 
            }

            board_object.appendChild(tile)
        }
    }
    return [board_array, board_object];
}

//EVENT HANDLER
//really wish i had pointers for this function.
function handle_click(e, game_board, turn_state, jump_info)
{
    handle_piece_selection(e, game_board, turn_state, jump_info)

    // only let user select a tile to make a move if they have also selected a piece
    if(turn_state.selected_piece != undefined)
        turn_state.selected_tile = get_selected_tile(e, turn_state.selected_tile) 


    //if both a move and a tile have been selected, then try to make the move.
    if(turn_state.selected_piece != undefined && turn_state.selected_tile != undefined)
        handle_move(e, game_board, turn_state, jump_info)
}

function handle_move(e, game_board, turn_state, jump_info)
{
    //if the piece moves in a valid way, not accounting for force jumps.
    let move = evaluate_move(game_board, turn_state.selected_piece.parentNode , turn_state.selected_tile)
    if(move.is_valid && move.is_jump == jump_info.must_jump) {
        if(move.is_jump) 
            execute_jump(game_board, turn_state, jump_info, move)
        else 
            execute_move(game_board, turn_state, jump_info, move)
    } else {
        //unselect piece and tile, and show force jump outlines again
        turn_state.selected_piece.style.borderColor = 
            turn_state.selected_piece.dataset.defaultBorderColor

        turn_state.selected_piece = undefined 
        turn_state.selected_tile = undefined 
        change_border_colors(game_board, jump_info.possible_jumps, FORCE_JUMP_HIGHLIGHT_COLOR)
    }
}

function handle_piece_selection(e, game_board, turn_state, jump_info)
{
    turn_state.selected_piece = get_valid_selected_piece(
        e, turn_state.selected_piece, turn_state.is_black_turn, jump_info.possible_jumps
    );

    //if we have unselected the piece, unselect the tile too
    //and return force jump outlines.
    if(turn_state.selected_piece == undefined)
    {
        turn_state.selected_tile = undefined
        change_border_colors(
            game_board, jump_info.possible_jumps, FORCE_JUMP_HIGHLIGHT_COLOR
        );
    } else {
        //we just choose a piece, so unselect the highlighted force jump pieces
        change_border_colors(
            game_board, jump_info.possible_jumps, turn_state.selected_piece.dataset.defaultBorderColor
        );
        turn_state.selected_piece.style.borderColor = "white"
    }
}

//does all the stuff to change the turn to the other player's turn
function change_turn(game_board, turn_state, jump_info, valid_move)
{
    //actually change the turn
    turn_state.is_black_turn = !turn_state.is_black_turn

    //unselecte moved piece
    turn_state.selected_piece.style.borderColor = turn_state.selected_piece.dataset.defaultBorderColor
    turn_state.selected_piece = undefined;

    //update the force jump info and highlight force jump pieces.
    jump_info.possible_jumps = all_possible_jumps(game_board, turn_state.is_black_turn)
    change_border_colors(game_board, jump_info.possible_jumps, FORCE_JUMP_HIGHLIGHT_COLOR)
    jump_info.must_jump = jump_info.possible_jumps.length > 0 ;
}

//completes a move 
function execute_move(game_board, turn_state, jump_info, valid_move, )
{
    if(!valid_move.jumping && !jump_info.must_jump)
    {
        move_piece(game_board, turn_state.selected_piece, turn_state.selected_tile)
        change_turn(game_board, turn_state,  jump_info, valid_move)
    }

    turn_state.selected_piece = undefined;
    turn_state.selected_tile = undefined;
}

//completes a jump
function execute_jump(game_board, turn_state, jump_info,  move)
{
    move_piece(game_board, turn_state.selected_piece, turn_state.selected_tile)
    remove_piece(game_board, move.jumped_tile_coords)

    //check for chain jumps. 
    let dest_tile_pos = [ turn_state.selected_tile.dataset.row, turn_state.selected_tile.dataset.col ]
    let chain_jumps = possible_jumps(game_board, dest_tile_pos) 
    chain_jumping = chain_jumps.length > 0  

    //if we chain jump, then keep the current piece selected.
    if(chain_jumping) {
        jump_info.possible_jumps = [ { piece_coord: dest_tile_pos, landing_positions: chain_jumps } ]
        jump_info.must_jump = true
        turn_state.selected_piece.style.borderColor = "white"
    } else {
        change_turn(game_board, turn_state, jump_info,  move)
    }

    turn_state.selected_tile = undefined;
}

//*list_of_position_objects* must be a list of objects with a *piece_coord* field that 
//is a row and column number
function change_border_colors(game_board, list_of_position_objects, color)
{
    if(list_of_position_objects == undefined)
        return

    for(let i = 0; i < list_of_position_objects.length; i++)
    {
        let curr_pos = list_of_position_objects[i].piece_coord
        game_board[ curr_pos[0] ][ curr_pos[1] ][0].firstChild.style.borderColor = color
    }
}

function remove_piece(game_board, coords)
{
    game_board[coords[0]][coords[1]][0].removeChild( game_board[coords[0]][coords[1]][0].firstChild )
    game_board[coords[0]][coords[1]][1] = empty_tile_info()
}

function empty_tile_info()
{
    return { has_piece: false,
            piece_is_black: undefined,
            piece_is_promoted: undefined, };
}



//checks if a move is a valid non-jump move.
function valid_non_skip(game_board, origin, dest)
{
    // 0 a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
    let orig_full = game_board[origin[0]][origin[1]][1].has_piece 
    let dest_full = game_board[dest[0]][dest[1]][1].has_piece 

    if(!orig_full || dest_full)
    {
        return false;
    }


    let piece_info  = game_board[origin[0]][origin[1]][1]

    let valid_rows 
    if(piece_info.piece_is_promoted)
        valid_rows = [ +origin[0] - 1, +origin[0] + 1 ]
    else 
        valid_rows = [ +origin[0] + 1 - ( 2 * piece_info.piece_is_black) ]

    //determine which colmuns the piece can move to.
    let valid_cols = adjacent_columns(origin)


    let is_valid_row = exists_matching_move(dest[0], valid_rows);
    let is_valid_col = exists_matching_move(dest[1], valid_cols);

    return is_valid_col && is_valid_row && on_board(game_board, dest)
}

function adjacent_columns(pos)
{
    return pos[0] % 2 == 0 ? [ pos[1], +pos[1] + 1 ] : [ pos[1] - 1, pos[1] ]
}

//checks if a move is a valid skip
function valid_skip_destination(game_board, origin, dest)
{
    if(!on_board(game_board, origin))
        return false;

    let piece_info = game_board[origin[0]][origin[1]][1]

    let valid_cols = [+origin[1] + 1, +origin[1] - 1]
    let valid_rows
    if(piece_info.piece_is_promoted) 
        valid_rows = [ +origin[0] + 2, origin[0] - 2 ]
    else 
        valid_rows = [ +origin[0] + 2 - (4 * piece_info.piece_is_black)]

    let is_valid_row    = exists_matching_move(dest[0], valid_rows);
    let is_valid_col    = exists_matching_move(dest[1], valid_cols);

    return is_valid_row && is_valid_col && on_board(game_board, dest)
}

//returns the coordinates of the tile that was skipped. If not passing in an origin
//and dest validated by valid_skip_destination results are undefined.
function get_skipped_tile_coords(game_board, origin, dest)
{

    //check the tile we are jumping over has a piece of the opposite colour
    let hor_dir = (dest[1] - origin[1]) / Math.abs(dest[1] - origin[1])
    let possible_cols = adjacent_columns(origin)
    let jumped_col = possible_cols[ +(hor_dir > 0) ] 

    let ver_dir = (dest[0] - origin[0]) / Math.abs(dest[0] - origin[0])
    let jumped_tile_coords = [+origin[0] + +ver_dir, jumped_col] 
    return jumped_tile_coords
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

//checks if a move is valid and returns an object.
//indicating if the move is valid, if it was a jump, 
//and tile that was skipped over 
function evaluate_move(game_board, orig_tile, dest_tile)
{
    let origin = [orig_tile.dataset.row, orig_tile.dataset.col]
    let dest   = [dest_tile.dataset.row, dest_tile.dataset.col]

    let result = { is_valid: false, is_jump: false, jumped_tile_coords: undefined };
    if(valid_non_skip(game_board, origin, dest)) {
        result.is_valid = true;
        result.is_jump  = false;

    } else if(valid_skip_destination(game_board, origin, dest)) {

        let jumped_tile_coords = get_skipped_tile_coords(game_board, origin, dest)
        let jumped_tile_info = game_board[jumped_tile_coords[0]][jumped_tile_coords [1]][1]
        let piece_is_black = orig_tile.firstChild.dataset.isBlack
        if(jumped_tile_info.has_piece && jumped_tile_info.piece_is_black != piece_is_black)
        {
            result.is_valid = true;
            result.is_jump = true;
            result.jumped_tile_coords = jumped_tile_coords;
        }
    }

    return  result;
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

    //update the board.
    selected_piece.parentNode.removeChild(selected_piece)
    selected_tile.appendChild(selected_piece)

    game_board[dest_row][dest_col][1] = game_board[orig_row][orig_col][1]; 
    game_board[orig_row][orig_col][1] = empty_tile_info();

    //end of board, should promote to king.
    if( (dest_row == 0 || dest_row == BOARD_SIZE - 1) && !game_board[dest_row][dest_col][1].piece_is_promoted )
    {
        game_board[dest_row][dest_col][1].piece_is_promoted = true;
        let crown = document.createElement("img")
        crown.src = "crown.png"
        crown.classList.add("crown")
        game_board[dest_row][dest_col][0].firstChild.appendChild(crown)
    }

    //change the border color of the piece to unselected.
    selected_piece.style.borderColor = selected_piece.dataset.defaultBorderColor 
}


function get_selected_tile(e, selected_tile)
{
    //don't let the player select a tile with a piece on it or a red tile.
    if( e.target.firstChild == null && 
        e.target.classList.contains("tile") &&
        e.target.dataset.red != "true"
       ) selected_tile = e.target

    return selected_tile; 
}

//returns true if the coordinate falls on the board.
function on_board(board, coordinate)
{
    return !( coordinate[0] >= board.length || coordinate[0] < 0 ||
        coordinate[1] >= board[0].length || coordinate[1] < 0  )
}

//returns the tile that was clicked on (if a tile was clicked on)
//if a non-empty array is specified as valid_pieces, then the function will only
//return a new *selected_piece* if it's position matches an element in *valid_pieces*
function get_valid_selected_piece(e, selected_piece, is_black_turn, valid_pieces)
{

    //this handles the case that there is a promoted piece with a crown icon that we
    //need to be able to click on.
    let target
    if(e.target.classList.contains("piece"))
        target = e.target
    else
        target = e.target.parentNode


    //do not change the selected piece if piece wasn't clicked 
    if( !target.classList.contains("piece"))
        return selected_piece

    //check if the current piece matches an element of valid_pieces
    if(valid_pieces.length != 0) {
        let is_valid_piece = false;
        let piece_coords = [ target.parentNode.dataset.row, target.parentNode.dataset.col]
        for(let i = 0; i < valid_pieces.length; i++)
        {
            let curr_valid_piece = valid_pieces[i].piece_coord
            if(curr_valid_piece[0] == piece_coords[0] && curr_valid_piece[1] == piece_coords[1]) 
                is_valid_piece = true;
        }

        if(!is_valid_piece)
            return undefined
    }


    //don't let them choose a piece when it isn't their turn
    if(target.dataset.isBlack != "" + is_black_turn)
        return selected_piece

    //update the selected piece and set the previously selected piece back to unselected. 
    if(selected_piece != undefined)
        selected_piece.style.borderColor = selected_piece.dataset.defaultBorderColor

    if(selected_piece != target)
    {
        selected_piece = target
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
        piece.dataset.defaultBorderColor = RED_PIECE_BORDER_COLOR 
    else
        piece.dataset.defaultBorderColor = BLACK_PIECE_BORDER_COLOR 

    piece.style.borderColor = piece.dataset.defaultBorderColor 

    return piece
}

//sets up a game of checkers
// 0b 0 a b c. bit a is if there is a piece, bit b is if it is black bit c is if it's promoted.
function init_board(board)
{
    for (let row = 0; row < 3; row++) {
        for (let j = 0; j < BOARD_SIZE / 2; j++) {

            let piece = create_piece(RED_PIECE_COLOR) 
            piece.dataset.isBlack = false
            board[row][j][0].appendChild(piece)
            let tile_info = empty_tile_info() 
            tile_info.has_piece         = true;
            tile_info.piece_is_black    = false;
            tile_info.piece_is_promoted = false;
            board[row][j][1] = tile_info



            piece = create_piece(BLACK_PIECE_COLOR) 
            piece.dataset.isBlack = true
            board[BOARD_SIZE - row - 1][j][0].appendChild(piece)
            tile_info = empty_tile_info() 
            tile_info.has_piece         = true;
            tile_info.piece_is_black    = true;
            tile_info.piece_is_promoted = false;
            board[BOARD_SIZE - row - 1][j][1] = tile_info
        }
    }
}


//this funciton is meant for use when checking if a piece has a jump over another piece.
//It takes the piece (origin) and returns the tile it would land on if it jumped over first.
//origin and jumped MUST be actually adjacent for sencical results.
function get_landing_pos(origin, jumped)
{
    let row_diff = 2 * (jumped[0] - origin[0])
    let col_diff = jumped[1] - origin[1] 

    if(col_diff == 0)
        col_diff = 1 - 2 * (origin[0] % 2 == 0)

    return [+origin[0] + row_diff, +origin[1] + col_diff]
}

//returns true if there is a possible jump the piece at *pos* can make.
function possible_jumps(game_board, pos)
{
    let tile = game_board[ pos[0] ][ pos[1] ][1]

    //can't jump without a piece
    if(!tile.has_piece)
        return [];

    let adjacent_cols    = adjacent_columns(pos)
    let possible_rows    = tile.piece_is_promoted ? [+pos[0] + 1, pos[0] - 1] : [ +pos[0] + 1 - (2 * tile.piece_is_black)]

    //check if there are any adjacent tiles in the direction the piece can 
    //jump with opposite the colour.
    let adjacent_opponents = []
    
    for (let i = 0; i < possible_rows.length; i++)
    {
        for (let j = 0; j < adjacent_cols.length; j++)
        {
            if(!on_board(game_board, [ possible_rows[i], adjacent_cols[j] ]))
                continue;

            let curr_tile = game_board[ possible_rows[i] ][ adjacent_cols[j] ][1]
            if( curr_tile.has_piece && curr_tile.piece_is_black != tile.piece_is_black )
                adjacent_opponents.push( [possible_rows[i], adjacent_cols[j]] )
        }
    }

    let jumps_possible= []
    for (let i = 0; i < adjacent_opponents.length; i++)
    {
        let curr_opponent_pos =  [ adjacent_opponents[i][0],  adjacent_opponents[i][1] ] 
        let landing_pos = get_landing_pos(pos, curr_opponent_pos)
        if(on_board(game_board, landing_pos) && !game_board[landing_pos[0]][landing_pos[1]][1].has_piece)
            jumps_possible.push(landing_pos)
    }

    return jumps_possible;
}

function all_possible_jumps(game_board, black_move)
{
    let jump_list = []
    for( let row = 0; row < game_board.length; row++)
    {
        for( let col = 0; col < game_board[0].length; col++)
        {
            if(game_board[ row ][ col ][1].piece_is_black != black_move)
                continue;

            let landing_tiles = possible_jumps( game_board, [row, col] )
            if(landing_tiles.length != 0)
                jump_list.push( { piece_coord: [row, col], landing_positions: landing_tiles} )
        }
    }

    return jump_list;
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

function main()
{

    let jump_info = {
        possible_jumps:  [],
        highlighted_landing_tiles:  [],
        must_jump: false,
    };

    let turn_state = {
        selected_piece: undefined,
        selected_tile: undefined,
        is_black_turn: true,
    };


    let [ game_board, board_object ] = create_board()

    board_object.addEventListener("mousedown", (e) => {
        handle_click(e, game_board, turn_state, jump_info);
    })

    init_board(game_board)
}
