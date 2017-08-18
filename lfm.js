window.onload = function(){
	FRAMERATE = 60;
	var container = document.getElementsByClassName("game-container");
	var gameHeight = 960;
	var gameWidth = 960;
	container[0].innerHTML = "<canvas id='gameCanvas' height = '" + gameHeight + "px' width = '" + gameWidth+ "px'></canvas>"
	var canvas = document.getElementById('gameCanvas');
	gameBoard.create(50,50);
	gameBoard.createObstacles(800);
	gameBoard.draw(canvas);
	var cr = canvas.getBoundingClientRect();
	var YOffset = cr.top;
	var XOffset = cr.left;
	canvas.addEventListener("click",function(e){
		e.preventDefault();
		var xpos = e.clientX - XOffset;
		var ypos = e.clientY - YOffset;
		player.setDestination(gameBoard.clicked(xpos, ypos));
	},false);
	var player = new character(gameBoard.getSquare(0,0));
	setInterval(function(){
		player.update(gameBoard);
		gameBoard.draw(canvas);
		player.draw(canvas, gameBoard.getSize.call(gameBoard, canvas));
	},1000/FRAMERATE);

	//Up next! Creating explosions to kill the new player 
	//var myExplosion = new explosion(gameBoard.getSquare(3,3),3);
	//console.log(myExplosion);
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
		this.draw = function(ctx,size){
			ctx.fillStyle = this.bgcolor;
			ctx.fillRect(this.xloc*size, this.yloc*size, size, size);
		};

		this.randomColor = function(){
			this.bgcolor = '#'+Math.floor(Math.random()*16777215).toString(16);
		};
		this.empty = true;
		this.passable = true;
		this.danger = 0;
		this.difficulty = 1;
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
				newSquare.bgcolor = "#FFFFFF";
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
		return foundSquare;
	};

	var createObstacles = function(numOfObs){
		console.log("creating Obstacles");
		var colSize = boardArray.length;
		var rowSize = boardArray[0].length;
		for(var i = 0; i < numOfObs; i++){
			var randCol = Math.floor(Math.random()*(colSize));
			var randRow = Math.floor(Math.random()*(rowSize));
			boardArray[randCol][randRow].empty = false;
			boardArray[randCol][randRow].passable = false;
			boardArray[randCol][randRow].bgcolor = "#000000";
		}
	};

	var draw = function(canvas){
		ctx = canvas.getContext("2d");
		var canvasHeight = canvas.height;
		var canvasWidth = canvas.width;
		size = canvasHeight / boardHeight;
		boardArray.forEach(function(row, bindex){
			row.forEach(function(square,rindex){
				if(square.empty){square.draw(ctx,size);}
			});
		});
	};

	var getSize = function(canvas){
		var canvasHeight = canvas.height;
		var canvasWidth = canvas.width;
		return canvasHeight / boardHeight;
	};

	var getDirection = function(square1, square2){
		var foundDir = "";
		var neighbors = square1.neighbors;
		for(var direction in neighbors){
			if(neighbors[direction] == square2){
				return direction;
			}
		}
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
		getSquare : getSquare,
		getSize : getSize,
		createObstacles : createObstacles,
		getDirection : getDirection
	}
})();

var character = function(location){
	this.imageObj = new Image();
	this.imageObj.src = "https://image.ibb.co/ca1PZv/guy.png";
	this.location = location;
	this.path = [];
	this.destination = null;
	//How often the entity moves in seconds
	this.speed = 1000/.75;

	var calculatedSquare = function(square, moveValue, heuristic, cameFrom){
		this.square = square;
		this.cameFrom = cameFrom;
		this.moveValue = moveValue;
		this.heuristic = heuristic;
		this.value = moveValue + heuristic;
	};

	var getHeuristic = function(square, destination){
		horizMovement = Math.abs(square.xloc - destination.xloc);
		vertMovement = Math.abs(square.yloc - destination.yloc);
		return horizMovement + vertMovement;
	};

	var getNeighboringSquares = function(currentSquare, closedSet,openSet){
		var neighbors = currentSquare.square.neighbors;
		var calculatedNeighbors = [];
		for(var direction in neighbors){
			var directionValue = getDirValue(direction);
			var nearbySquare = neighbors[direction];
			if(!hasSquare(closedSet, nearbySquare) && !hasSquare(openSet, nearbySquare) && nearbySquare.passable){
				var nearbyCalculated = new calculatedSquare(nearbySquare, currentSquare.moveValue + directionValue, getHeuristic(nearbySquare, this.destination),currentSquare);
				calculatedNeighbors.push(nearbyCalculated);
			}
		}
		return calculatedNeighbors;
	};

	var getDirValue = function(direction){
		if(direction == "left" || direction == "right" || direction == "up" || direction == "down"){
			return 1;
		}
		else{
			return 1.5;
		}
	};

	var hasSquare = function(array,square){
		var squareExists = false;
		for(var i = 0; i < array.length ; i++){
			if(array[i].square == square){
				squareExists = true;
			}
		}
		return squareExists;
	}

	this.findPath = function(){
		var openSet = [];
		var closedSet = [];
		var currentSquare = new calculatedSquare(this.location, 0, getHeuristic(location, this.destination), null);
		while(currentSquare.heuristic > 0 ){
			closedSet.push(currentSquare);
		    openSet = openSet.concat(getNeighboringSquares.call(this, currentSquare,closedSet,openSet));
		    openSet.sort(function(a,b){
				return a.value - b.value;
			 });
			 currentSquare = openSet.shift();
		}
		var path = [];
		while(!(currentSquare.cameFrom == null)){
			path.push(currentSquare.square);
			currentSquare = currentSquare.cameFrom;
		}
		this.path = path.reverse();
	};

	this.update = function(){
		var counter = 0; 
		return function(board){
				var speedMod = getDirValue(board.getDirection(this.location, this.path[0]))
				var counterGoal = Math.floor((this.speed/FRAMERATE)*speedMod);
				counter++;
				if(counter > counterGoal && this.path.length > 0){
					this.setLocation(this.path.shift());
					counter = 0;
				}
			};
	}.call(this);

	this.setLocation = function(square){
		this.location.empty = true;
		this.location = square;
		this.location.empty = false;
	}
	
	this.setDestination = function(square){
		if(square.passable){
			if(!(this.destination==null)){
				this.destination.bgcolor = "#FFFFFF"
			}
			this.destination = square;
			this.destination.bgcolor = "#228B22"
			this.findPath();
		}
	};

	this.draw = function(canvas, size){
		ctx = canvas.getContext("2d");
		var xpos = this.location.xloc;
		var ypos = this.location.yloc;
		ctx.drawImage(this.imageObj, xpos*size, ypos*size,size,size);
	};
};

var explosion = function(square, radius){
	this.radius = radius;
	this.squares = [];
	this.init = function(square){
		collectSquares(square,this.squares,0);
	};

	this.init();

	var collectSquares = function(square,squareArray,counter){
		if(counter <= radius && !hasSquare(squareArray, square)){
			squareArray.push(square);
			var cardinals = getCardinals(square);
			for(square in cardinals){
				collectSquares(square, squareArray, counter+1);
			}
		}
	};

	var hasSquare = function(array,square){
		var squareExists = false;
		for(var i = 0; i < array.length ; i++){
			if(array[i].square == square){
				squareExists = true;
			}
		}
		return squareExists;
	};

	var getCardinals = function(square){
		var cardinals = [];
		var neighbors = square.neighbors;
		for(var direction in neighbors){
			if(direction == "left" || direction == "right" || direction == "up" || direction == "down"){
				cardinals.push(neighbors[direction]);
			}
		}
		return cardinals;
	};
};	