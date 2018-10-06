
class DomokunMaze_v2 {
    constructor(width, height, ponyName, difficulty) {
        this.width = width;
        this.height = height;
        this.ponyName = ponyName;
        this.difficulty = difficulty;
        this.playerMovesDetail = {};
        this.playedCellsStatus = {};
        this.isChanginPosition = false;
        this.escapeRoutes = [];
    }
    get apiBaseUrl() {
        return 'https://ponychallenge.trustpilot.com/pony-challenge/maze';
    }
    startGame() {
        this.initNewMaze();
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
        $.when(this.getMazeStateAjax(),this.getMazePrintAjax()).done((res1, res2) => {
                $('.mazeBoard > pre > code').text(res2[0]);
                this.mazeState = res1[0];
                if(this.escapeRoutes.length === 0)
                    this.getRouteToEscape(this.mazeState.pony[0]);
                this.playAI()
                this.isChanginPosition = false;
            });
    }
    getMazeStateAjax(){
        return $.ajax({
            type: 'GET',
            url: this.apiBaseUrl + '/' + this.mazeId
        });
    }
    getMazePrintAjax(){
        return $.ajax({
            type: 'GET',
            url: this.apiBaseUrl + '/' + this.mazeId + '/print'
        });
    }
    calcAvailableDirections(cellId) {
        let directions = []
        let openSides = 0
        let newCellId = cellId - this.width;
        let isDeadEnd;
        if (newCellId > -1 &&
            this.mazeState.data[cellId].indexOf('north') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['north', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = cellId - 1;
        if (newCellId > -1 &&
            this.mazeState.data[cellId].indexOf('west') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['west', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = cellId + 1;
        if ((newCellId) % (this.width - 1) < this.width && newCellId < (this.width * this.height) &&
            this.mazeState.data[newCellId].indexOf('west') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['east', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        newCellId = cellId + this.width;
        if (newCellId < (this.width * this.height) &&
            this.mazeState.data[newCellId].indexOf('north') == -1) {
            isDeadEnd = this.isDeadEnd(newCellId);
            directions.push(['south', newCellId, isDeadEnd, this.isVisited(newCellId), this.isDokumonThere(newCellId)]);
            if (!isDeadEnd)
                openSides++;
        }
        this.playedCellsStatus[cellId] = {
            'isDeadEnd': openSides === 1,
            'visited': true,
            'availableDirections': directions
        };
    }
    playAI() {
        this.changeCell(this.escapeRoutes.shift().split('-')[1]);
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
                    } else if (result['state'] == 'over') {
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

    getRouteToEscape(fromCellId) {
        this.escapeRoutes = this.findRoutesToEscape(fromCellId, -1).split(',').slice(0,-1);
    }
    findRoutesToEscape(fromCellId, previousCellId) {
        if (fromCellId === this.mazeState['end-point'][0])
            return fromCellId+',endPoint';

        this.calcAvailableDirections(fromCellId);
        let paths = [];
        for (let i = 0; i < this.playedCellsStatus[fromCellId]['availableDirections'].length; i++) {
            if (this.playedCellsStatus[fromCellId]['availableDirections'][i][1] === previousCellId)
                continue;
            paths.push(fromCellId +
                '-'+this.playedCellsStatus[fromCellId]['availableDirections'][i][0]+',' +
                this.findRoutesToEscape(
                    this.playedCellsStatus[fromCellId]['availableDirections'][i][1],
                    fromCellId)
            );
        }
        if (paths.length == 0)
            return fromCellId+',deadEnd';
        let result = paths.filter((path) => { return path.indexOf('endPoint') > -1 });
        if (result.length)
            {
                console.log(result);
                return result[0];}
        result = paths.filter((path) => { return path.indexOf('deadEnd') === -1 });
        if (result.length)
            return result[0];
        return paths[0]
    }
}