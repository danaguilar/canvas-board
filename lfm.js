window.onload = function(){
	var container = document.getElementsByClassName("game-container");
	var gameHeight = 960;
	var gameWidth = 960;
	container[0].innerHTML = "<canvas id='gameCanvas' height = '" + gameHeight + "px' width = '" + gameWidth+ "px'></canvas>"
	var canvas = document.getElementById('gameCanvas');
	gameBoard.create(50,50);
	gameBoard.draw(canvas);
	var cr = canvas.getBoundingClientRect();
	var YOffset = cr.top;
	var XOffset = cr.left;
	canvas.addEventListener("click",function(e){
		e.preventDefault();
		var xpos = e.clientX - XOffset;
		var ypos = e.clientY - YOffset;
		gameBoard.clicked(xpos, ypos);
	},false);
	var player = new character(gameBoard.getSquare(2,3));
	player.setDestination(gameBoard.getSquare(0,0))
	console.log(player.findPath()); 
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
		this.neighbors = {};
		this.name = function(){
			return this.xloc + "-" + this.yloc;
		}
		this.draw = function(){
			ctx.fillStyle = this.bgcolor;
			ctx.fillRect(this.xloc*size, this.yloc*size, size, size);
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
						linkTopLeftBtmRight(newSquare, aboveSquare.neighbors['left']);
					}

					if(y<(height-1)){
						linkTopRightBtmLeft(newSquare,aboveSquare.neighbors['right']);
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
		square1.neighbors['left'] = square2;
		square2.neighbors['right'] = square1;
	};
	var linkUpDown = function(square1, square2){
		square1.neighbors['up'] = square2;
		square2.neighbors['down'] = square1;
	};
	var linkTopRightBtmLeft = function(square1,square2){
		square1.neighbors['topRight'] = square2;
		square2.neighbors['btmLeft'] = square1;
	};
	var linkTopLeftBtmRight = function(square1,square2){
		square1.neighbors['topLeft'] = square2;
		square2.neighbors['btmRight'] = square1;
	};

	var getSquare = function(xloc, yloc){
		return boardArray[yloc][xloc];
	}


	return {
		create : create,
		draw : draw,
		clicked : clicked,
		getSquare : getSquare
	}
})();

var character = function(location){
	this.location = location;
	this.destination = null;
	var calculatedSquare = function(square, moveValue, heuristic){
		this.square = square;
		this.moveValue = moveValue;
		this.heuristic = heuristic;
		this.value = moveValue + heuristic;
	};

	var getHeuristic = function(square){
		horizMovement = Math.abs(square.xloc - this.destination.xloc);
		vertMovement = Math.abs(square.yloc - this.destination.yloc);
		return horizMovement + vertMovement;
	};

	this.setDestination = function(square){
		destination = square;
	};

	this.findPath = function(){
		var openSet = [];
		var currentSquare = new calculatedSquare(this.location, 0, getHeuristic(location));
		var closedSet = [currentSquare];
		var getNeighboringSquares = function(){
			console.log(currentSquare);
			var neighbors = currentSquare.neighbors;
			console.log(neighbors);
			var calculatedNeighbors = [];
			for(var direction in neighbors){
				var nearbySquare = neighbors[direction];
				calculatedNeighbors.push(new calculatedSquare(nearbySquare, currentSquare.moveValue + 1, getHeuristic(nearbySquare)));
			}
			return calculatedNeighbors;
		};
		openSet = openSet.concat(getNeighboringSquares());
	return openSet;
	}
};
