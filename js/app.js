
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
        if (!this.playedCellsStatus[this.mazeState.pony[0]]) {
            let directions = [['stay', this.mazeState.pony[0]]]
            let openSides = 0
            if (this.mazeState.pony[0] - this.width > -1 && this.mazeState.data[this.mazeState.pony[0]].indexOf('north') == -1) {
                directions.push(['north', this.mazeState.pony[0] - this.width]);
                openSides++;
            }
            if (this.mazeState.pony[0] - 1 > -1 && this.mazeState.data[this.mazeState.pony[0]].indexOf('west') == -1) {
                directions.push(['west', this.mazeState.pony[0] - 1]);
                openSides++;
            }
            if ((this.mazeState.pony[0] + 1) % (this.width - 1) < this.width && this.mazeState.data[this.mazeState.pony[0] + 1].indexOf('west') == -1) {
                directions.push(['east', this.mazeState.pony[0] + 1]);
                openSides++;
            }
            if ((this.mazeState.pony[0] + this.width) < (this.width * this.height) && this.mazeState.data[this.mazeState.pony[0] + this.width].indexOf('north') == -1) {
                directions.push(['south', this.mazeState.pony[0] + this.width]);
                openSides++;
            }
            this.playedCellsStatus[this.mazeState.pony[0]] = {
                'isDeadEnd': openSides === 1,
                'visited': true,
                'availableDirections': directions
            }
        } else {
            this.playedCellsStatus[this.mazeState.pony[0]]['isDeadEnd'] = false;
        }
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
        let directions = this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].slice(1)
        let direction;
        let safeDirections = [];
        while (directions.length) {
            direction = directions.pop();
            let cellId = direction[1];
            if (this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].length < 4 &&
                this.playedCellsStatus[cellId] && this.playedCellsStatus[cellId]['isDeadEnd']) {
                this.playedCellsStatus[this.mazeState.pony[0]]['isDeadEnd'] = true;
            }
            if (this.isCellRightChoice(cellId)) {
                safeDirections.push(direction)
                if (this.playedCellsStatus[cellId] == undefined ||
                    !this.playedCellsStatus[cellId]['visited'] ||
                    !directions.length) {
                    if (this.playedCellsStatus[cellId] && this.playedCellsStatus[cellId]['isDeadEnd'])
                        continue;
                    this.changeCell(direction[0]);
                    return;
                }
            }
            else if (this.playedCellsStatus[this.mazeState.pony[0]]['availableDirections'].length == 2) {
                this.changeCell('stay');
            }
        }
        if (safeDirections.length)
            this.changeCell(safeDirections[0][0]);
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
                    if (result['state-result'] == 'Move accepted') {
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
    isCellRightChoice(cellId) {
        if (cellId == this.mazeState.domokun[0]) {
            return false;
        }
        return true;
    }
}