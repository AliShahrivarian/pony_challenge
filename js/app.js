
class DomokunMaze {
    constructor(width, height, ponyName, difficulty, is_human_player) {
        this.width = width;
        this.height = height;
        this.ponyName = ponyName;
        this.difficulty = difficulty;
        this.is_human_player = is_human_player;
        this.playerMovesDetail = {};
        this.playedCellsStatus = {};
        this.isChanginPosition = false;
    }
    get apiBaseUrl() {
        return 'https://ponychallenge.trustpilot.com/pony-challenge/maze';
    }
    startGame() {
        this.initNewMaze();
        if (this.is_human_player) {
            this.bindDirectionKeys();
        }
    }
    initNewMaze() {
        $.ajax({
            type: 'POST',
            url: this.apiBaseUrl,
            data: JSON.stringify({
                'maze-width': this.width,
                'maze-height': this.height,
                'maze-player-name': this.ponyName,
                'difficulty': this.difficulty
            }),
            contentType: 'application/json',
            success: (result) => {
                this.mazeId = result.maze_id;
                this.getMazeState();
            }
        });
    }
    getMazeState() {
        $.when($.ajax({
            type: 'GET',
            url: this.apiBaseUrl + '/' + this.mazeId
        }),
            $.ajax({
                type: 'GET',
                url: this.apiBaseUrl + '/' + this.mazeId + '/print'
            })).done((res1, res2) => {
                $('.mazeBoard > pre > code').text(res2[0]);
                this.mazeState = res1[0];
                this.calcAvailableDirections();
                if (!this.is_human_player) {
                    this.playAI()
                }
                $('.mazeBoard > pre > code').text(res2[0]);
                this.isChanginPosition = false;
            });
    }
    calcAvailableDirections() {
        let directions = []
        let openSides = 0
        let newCellId = this.mazeState.pony[0] - this.width;
        let isDeadEnd;
        if (newCellId > -1 &&
            this.mazeState.data[this.mazeState.pony[0]].indexOf('north') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['north', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = this.mazeState.pony[0] - 1;
        if (newCellId > -1 &&
            this.mazeState.data[this.mazeState.pony[0]].indexOf('west') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['west', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = this.mazeState.pony[0] + 1;
        if ((newCellId) % (this.width - 1) < this.width &&
            this.mazeState.data[newCellId].indexOf('west') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['east', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = this.mazeState.pony[0] + this.width;
        if ((newCellId) < (this.width * this.height) &&
            this.mazeState.data[newCellId].indexOf('north') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['south', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        this.playedCellsStatus[this.mazeState.pony[0]] = {
            'isDeadEnd': openSides === 1,
            'visited': true,
            'availableDirections': directions
        };
    }
    bindDirectionKeys() {
        if (this.isChanginPosition) {
            return;
        }
        $(document).keydown((e) => {
            switch (e.which) {
                case 37: // left
                    this.changeCell('west');
                    break;
                case 38: // up
                    this.changeCell('north');
                    break;
                case 39: // right
                    this.changeCell('east');
                    break;
                case 40: // down
                    this.changeCell('south');
                    break;
                default: return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
    }
    playAI() {
        // TODO: get all directions
        // TODO: iter directions
        // TODO: check if direction is visited or is deadEnd or is domokun there
        let directions = this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].slice()
            .filter((item) => { return !item.slice(-1)[0] })
        if (directions.length == 0) {
            this.changeCell('stay');
            return;
        } let endPoint = directions.filter((item) => { return item[1] == this.mazeState['end-point'][0] });
        if (endPoint.length) {
            this.changeCell(endPoint[0][0]);
            return;
        }
        let unvisited = directions.filter((item) => { return !item[3] });
        if (unvisited.length) {
            this.changeCell(unvisited[0][0]);
            return;
        }
        let notDeadEnds = directions.filter((item) => { return !item[2] });
        if (notDeadEnds.length) {
            this.changeCell(notDeadEnds[0][0]);
            return;
        }
        this.changeCell(directions[0][0]);
        // let direction;
        // let safeDirections = [];
        // while (directions.length) {
        //     direction = directions.pop();
        //     let cellId = direction[1];
        //     if (this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].length < 4 &&
        //         this.playedCellsStatus[cellId] && this.playedCellsStatus[cellId]['isDeadEnd']) {
        //         this.playedCellsStatus[this.mazeState.pony[0]]['isDeadEnd'] = true;
        //     }
        //     if (this.isDokumonThere(cellId)) {
        //         safeDirections.push(direction)
        //         if (this.playedCellsStatus[cellId] == undefined ||
        //             !this.playedCellsStatus[cellId]['visited'] ||
        //             !directions.length) {
        //             if (this.playedCellsStatus[cellId] && this.playedCellsStatus[cellId]['isDeadEnd'])
        //                 continue;
        //             this.changeCell(direction[0]);
        //             return;
        //         }
        //     }
        //     else if (this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].length == 2) {
        //         this.changeCell('stay');
        //     }
        // }
        // if (safeDirections.length)
        //     this.changeCell(safeDirections[0][0]);
    }
    changeCell(direction) {
        if (this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections']
            .filter((item) => item[0] === direction).length > 0) {
            this.isChanginPosition = true;
            $.ajax({
                type: 'POST',
                url: this.apiBaseUrl + '/' + this.mazeId,
                data: JSON.stringify({
                    'direction': direction
                }),
                contentType: 'application/json',
                success: (result) => {
                    if (result['state'] == 'won') {
                        alert('Pony wons!');
                    }else if(result['state'] == 'over'){
                        alert('Game Over!');
                    }
                    else if (result['state-result'] == 'Move accepted') {
                        this.getMazeState()
                    }
                }
            });
        }
    }
    getCellInNextDirection(direction) {
        let cellId = -1;
        switch (direction) {
            case 'west':
                cellId = this.mazeState.pony[0] - 1;
                break;
            case 'north':
                cellId = this.mazeState.pony[0] - this.width;
                break;
            case 'east':
                cellId = this.mazeState.pony[0] + 1;
                break;
            case 'south':
                cellId = this.mazeState.pony[0] + this.width;
                break;
        }
        return cellId;
    }
    isVisited(cellId) {
        if (this.playedCellsStatus[cellId] &&
            this.playedCellsStatus[cellId]['visited'])
            return true;
        return false;
    }
    isDeadEnd(cellId) {
        if (this.playedCellsStatus[cellId] &&
            this.playedCellsStatus[cellId]['isDeadEnd'])
            return true;
        return false;
    }
    isDokumonThere(cellId) {
        if (cellId == this.mazeState.domokun[0]) {
            return true;
        }
        return false;
    }
}