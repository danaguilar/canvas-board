window.onload = function(){
	var container = document.getElementsByClassName("game-container");
	var gameHeight = 960;
	var gameWidth = 960;
	container[0].innerHTML = "<canvas id='gameCanvas' height = '" + gameHeight + "px' width = '" + gameWidth+ "px'></canvas>"
	var canvas = document.getElementById('gameCanvas');
	gameBoard.create(20,20);
	gameBoard.draw(canvas);
	var cr = canvas.getBoundingClientRect();
	var YOffset = cr.top;
	var XOffset = cr.left;
	canvas.addEventListener("mousedown",function(e){
		e.preventDefault();
		var xpos = e.clientX - XOffset;
		var ypos = e.clientY - YOffset;
		gameBoard.clicked(xpos, ypos);
	},false);
}

var drawGrid = function(canvasID,size){
	var canvas = document.getElementById(canvasID);
	var ctx = canvas.getContext("2d");
	var boardHeight = 0;
	var boardWidth = 0;
	canHeight = canvas.height;
	canWidth = canvas.width;
	for(var i = 0; i <= canvas.width; i += size){
		ctx.moveTo(i, 0);
		ctx.lineTo(i,canHeight);
		ctx.stroke();
	}
	for(var j = 0; j <= canvas.width; j += size){
		ctx.moveTo(0,j);
		ctx.lineTo(canWidth,j);
		ctx.stroke();
	}
}

var gameBoard = (function(){
	//Array to store all the rows of squares. Every square can be accessed with boardArray[yloc][xloc]
	var boardArray = [];
	var ctx = 'default';
	var size = 0;

	//Square constructor. Includes the x and y location and a function to give a unique name to this square
	var square = function(xloc, yloc){
		this.xloc = xloc;
		this.yloc = yloc;
		this.name = function(){
			return this.xloc + "-" + this.yloc;
		}
		this.draw = function(){
			ctx.fillStyle = this.bgcolor;
			ctx.fillRect(this.xloc*size, this.yloc*size, size, size);
		};

		this.onClick = function(){
			this.bgcolor = '#'+Math.floor(Math.random()*16777215).toString(16);
			this.draw();
		};

		this.randomColor = function(){
			this.bgcolor = '#'+Math.floor(Math.random()*16777215).toString(16);
		};
	};

	//Creates the board as a grid of squares, height by width big. Also links those squares based on their position to each other
	var create = function(height, width){
		boardHeight = height;
		boardWidth = width;
		//interate over all height and width to create the correct number of squares
		for(var x = 0; x < width; x++){
			//creates a new row
			var row = [];
			for(var y = 0; y < height; y++){
				//create new square
				newSquare = new square(x,y);

				//If the square has squares to the left of it...
				if(y > 0){
					//link the square before it to its left,
					linkLeftRight(newSquare,row[y-1]);
				}
				if(x > 0){
					//link the square above it
					aboveSquare = boardArray[x-1][y];
					linkUpDown(newSquare,aboveSquare);

					if(y>0){
						linkTopLeftBtmRight(newSquare, aboveSquare.left);
					}

					if(y<(height-1)){
						linkTopRightBtmLeft(newSquare,aboveSquare.right);
					}
				}
				//pushes the square into the row
				row.push(newSquare);
			}
			//pushes the row into the board
			boardArray.push(row);
		}
	};

	var clicked = function(xpos, ypos){
		var col = Math.floor(xpos/size);
		var row = Math.floor(ypos/size);
		var foundSquare = boardArray[col][row];
		foundSquare.randomColor();
		foundSquare.draw();
	};

	var draw = function(canvas){
		ctx = canvas.getContext("2d");
		var canvasHeight = canvas.height;
		var canvasWidth = canvas.width;
		size = canvasHeight / boardHeight;
		boardArray.forEach(function(row, bindex){
			row.forEach(function(square,rindex){
				square.draw(ctx,size);
			});
		});
	};

	//Functions to link pairs fo squares together
	var linkLeftRight = function(square1, square2){
		square1.left = square2;
		square2.right = square1;
	};
	var linkUpDown = function(square1, square2){
		square1.up = square2;
		square2.down = square1;
	};
	var linkTopRightBtmLeft = function(square1,square2){
		square1.topRight = square2;
		square2.btmLeft = square1;
	};
	var linkTopLeftBtmRight = function(square1,square2){
		square1.topLeft = square2;
		square2.btmRight = square1;
	};

	var getSquareByPixel = function(x, y){

	}

	return {
		create : create,
		draw : draw,
		clicked : clicked
	}
})();
