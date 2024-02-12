const bullet_speed_abs = 6;

class Bullet {
    x; y;
    speed_x; speed_y;
    type;

    constructor(type, start_x, start_y, speed_x, speed_y) {
        this.x = start_x;
        this.y = start_y;
        this.speed_x = speed_x;
        this.speed_y = speed_y;
        this.type = type;
    }

    isIntersect(obj_img, my_img, obj_x, obj_y) {
        return ((obj_x >= this.x && obj_x <= this.x + my_img.width) ||
            (obj_x + obj_img.width >= this.x && obj_x + obj_img.width <= this.x + my_img.width))
            &&
            ((obj_y >= this.y && obj_y <= this.y + my_img.height) ||
                (obj_y + obj_img.height >= this.y && obj_y + obj_img.height <= this.y + my_img.height))
    }

    move() {
        this.x += this.speed_x;
        this.y += this.speed_y;
    }
}

class EnemyShip {
    x; y;
    x_to; y_to;
    speed_abs;
    type;
    bullet_interval;
    shoot_timer;

    constructor(type, start_x, start_y, x_to, y_to) {
        this.x = start_x;
        this.y = start_y;
        this.x_to = x_to;
        this.y_to = y_to;

        this.type = type;
        this.speed_abs = 2;
        this.shoot_timer = 200;
    }

    isIntersect(obj_img, my_img, obj_x, obj_y) {
        return ((obj_x >= this.x && obj_x <= this.x + my_img.width) ||
            (obj_x + obj_img.width >= this.x && obj_x + obj_img.width <= this.x + my_img.width))
            &&
           ((obj_y >= this.y && obj_y <= this.y + my_img.height) ||
            (obj_y + obj_img.height >= this.y && obj_y + obj_img.height <= this.y + my_img.height))
    }

    isAtWaypoint() {
        return (this.x == this.x_to && this.y == this.y_to);
    }

    move() {
        var path_length = Math.sqrt(Math.pow(this.x - this.x_to, 2) + Math.pow(this.y - this.y_to, 2))
        if (path_length > this.speed_abs) {
            var vector_sin = (this.x_to - this.x) / path_length;
            var vector_cos = (this.y_to - this.y) / path_length;

            this.x += this.speed_abs * vector_sin;
            this.y += this.speed_abs * vector_cos;
        }
        else {
            this.x = this.x_to;
            this.y = this.y_to;
        }
    }

    shoot() {
        if (this.shoot_timer <= 0) {
            main.bullets.set(new Bullet("enemy", this.x + 50, this.y + 50, 0, bullet_speed_abs), true);
            this.shoot_timer = 200;
        }
        else this.shoot_timer--;
    }
}

/*class Level {
    waypoints;
    ships;

    constructor() {
        waypoints = new Map([
            ["left", []],
            ["right", []]
        ]);
        ships = new Map([
            ["left", []],
            ["right", []]
        ]);
    }

    addWaypoint(path, x_waypoint, y_waypoint) {
        this.waypoints[path][this.waypoints[path].length - 1] = [x_waypoint, y_waypoint];
    }

    addShips(path, type, count) {
        this.ships[path][this.ships[path].length - 1] = [type, count];
    }

    countWaypoints(path) {
        return this.waypoints[path].length;
    }

    getWaypoint(path, waypoint_number) {
        return this.waypoints[path][waypoint_number];
    }

    getShips(path, type) {
        return this.ships[path][type];
    }
}*/

var main = new Vue({
    el: '#main_app',
    data: {
        jet_x: 0,
        jet_y: 0,
        jet_speed_x: 0,
        jet_speed_y: 0,
        jet_speed_abs: 5,

        score: 0,
        score_table: null,

        is_lost: false,
        is_running: false,
        game_interval: null,
        game_fps: 60,
        pressed_buttons: null,
        shoot_delay: 1000,

        enemy_ships: null,
        bullets: null,
        hero_shoot_interval: null,
        enemy_spawn_interval: null,
        enemy_shoot_interval: null,
        //spawning: null,
        //spawn_pool: null,
        //waypoint_pool: null,

        //levels: [],
        //current_level: -1
    },
    imgs: {
        back: null,
        ship: null,
        enemies: null,
        hero_bullet: null,
        enemy_bullet: null
    },
    canvas: {
        canva: null,
        painter2d: null
    },
    mounted() {
        this.pressed_buttons = new Map();
        this.enemy_ships = new Map();
        this.bullets = new Map();
        this.enemies = new Map();
        this.score_table = new Map();
        //this.spawn_pool = new Map();
        //this.waypoint_pool = new Map();

        this.setupCanvas();
        this.loadImgs();
        setTimeout(() => {
            this.resetParams();
            this.drawScene();
        }, 100);

        this.setupScoreTable();

        document.addEventListener("keydown", this.onArrowDown);
        document.addEventListener("keyup", this.onArrowUp);
    },
    methods: {
        //Draw methods
        setupCanvas: function () {
            this.canva = document.getElementById('game_canvas');
            this.painter2d = this.canva.getContext('2d');
        },
        loadImgs: function () {
            this.back = new Image();
            this.ship = new Image();
            this.enemies.set("small", new Image());
            this.enemies.set("medium", new Image());
            this.enemies.set("big", new Image());
            this.hero_bullet = new Image();
            this.enemy_bullet = new Image();

            this.back.src = "img/game_back.png";
            this.ship.src = "img/jet.png";
            this.enemies.get("small").src = "img/spaceship1.png";
            this.enemies.get("medium").src = "img/spaceship4.png";
            this.enemies.get("big").src = "img/spaceship6.png";
            this.hero_bullet.src = "img/hero_bullet.png";
            this.enemy_bullet.src = "img/enemy_bullet.png";

            this.back.onload = () => {
                this.canva.width = this.back.width;
                this.canva.height = this.back.height;
            };
        },
        drawScene: function () {
            this.painter2d.font = "30px PressStart";
            this.painter2d.textAlign = "left";
            this.painter2d.textBaseline = "top";
            this.painter2d.fillStyle = "white";

            this.painter2d.clearRect(0, 0, this.canva.width, this.canva.height);
            this.painter2d.drawImage(this.back, 0, 0);
            this.painter2d.drawImage(this.ship, this.jet_x, this.jet_y);
            for (bullet of this.bullets.keys()) {
                if (bullet.type == "hero") this.painter2d.drawImage(this.hero_bullet, bullet.x, bullet.y);
                else if (bullet.type == "enemy") this.painter2d.drawImage(this.enemy_bullet, bullet.x, bullet.y);
            }
            for (enemy_ship of this.enemy_ships.keys()) {
                this.painter2d.drawImage(this.enemies.get(enemy_ship.type), enemy_ship.x, enemy_ship.y);
            }
            this.painter2d.fillText('Score: ' + String(this.score), 10, 10);
            if (this.is_lost) {
                this.painter2d.font = "40px PressStart";
                this.painter2d.textAlign = "center";
                this.painter2d.textBaseline = "middle";
                this.painter2d.fillStyle = "red";
                this.painter2d.fillText('You Lost', this.canva.width / 2, this.canva.height / 5);
            }
        },
        //Game methods
        setupScoreTable: function () {
            this.score_table.set("bullet", 10);
            this.score_table.set("small", 100);
            this.score_table.set("medium", 200);
            this.score_table.set("big", 300);
        },
        spawnEnemies: function () {
            spawn_rate = Math.random();
            position_x = Math.random() * (this.canva.width - 100);
            if (spawn_rate <= 0.3) {
                this.enemy_ships.set(new EnemyShip("small", position_x, -100, position_x, this.canva.height), true);
            }
            else if (spawn_rate <= 0.5) {
                this.enemy_ships.set(new EnemyShip("medium", position_x, -100, position_x, this.canva.height), true);
            }
            else if (spawn_rate <= 0.6) {
                this.enemy_ships.set(new EnemyShip("big", position_x, -100, position_x, this.canva.height), true);
            }
        },
        resetParams: function () {
            this.jet_x = this.canva.width / 2 - this.ship.width / 2;
            this.jet_y = this.canva.height - this.ship.height;
            this.enemy_ships.clear();
            this.bullets.clear();
            this.score = 0;
            this.is_lost = false;
        },
        move: function () {
            if (this.jet_x + this.jet_speed_x < this.canva.width - this.ship.width &&
                this.jet_x + this.jet_speed_x > 0)
                this.jet_x += this.jet_speed_x;
            if (this.jet_y - this.jet_speed_y < this.canva.height - this.ship.height &&
                this.jet_y - this.jet_speed_y > 0)
                this.jet_y -= this.jet_speed_y;
        },
        shoot: function () {
            this.bullets.set(new Bullet("hero", this.jet_x + this.ship.width / 2 - this.hero_bullet.width / 2, this.jet_y + this.ship.height / 4, 0, -bullet_speed_abs), true);
        },
        onArrowDown: function (event) {
            if (this.pressed_buttons.get(event.key)) return;
            this.pressed_buttons.set(event.key, true);

            this.jet_speed_y = 0;
            this.jet_speed_x = 0;

            var jet_speed = this.jet_speed_abs;
            if (this.pressed_buttons.size >= 2) jet_speed /= Math.sqrt(2);

            for (button of this.pressed_buttons.keys()) {
                if (button == "w" || button == "ö") {
                    this.jet_speed_y += jet_speed;
                }
                else if (button == "s" || button == "û") {
                    this.jet_speed_y -= jet_speed;
                }
                else if (button == "d" || button == "â") {
                    this.jet_speed_x += jet_speed;
                }
                else if (button == "a" || button == "ô") {
                    this.jet_speed_x -= jet_speed;
                }
            }
        },
        onArrowUp: function (event) {
            this.pressed_buttons.delete(event.key);

            this.jet_speed_y = 0;
            this.jet_speed_x = 0;

            var jet_speed = this.jet_speed_abs;
            if (this.pressed_buttons.size >= 2) jet_speed /= Math.sqrt(2);

            for (button of this.pressed_buttons.keys()) {
                if (button == "w" || button == "ö") {
                    this.jet_speed_y += jet_speed;
                }
                else if (button == "s" || button == "û") {
                    this.jet_speed_y -= jet_speed;
                }
                else if (button == "d" || button == "â") {
                    this.jet_speed_x += jet_speed;
                }
                else if (button == "a" || button == "ô") {
                    this.jet_speed_x -= jet_speed;
                }
            }  
        },
        isIntersect: function (obj_img, obj_x, obj_y) {
            return ((obj_x >= this.jet_x && obj_x <= this.jet_x + this.ship.width) ||
                (obj_x + obj_img.width >= this.jet_x && obj_x + obj_img.width <= this.jet_x + this.ship.width))
                &&
                ((obj_y >= this.jet_y && obj_y <= this.jet_y + this.ship.height) ||
                (obj_y + obj_img.height >= this.jet_y && obj_y + obj_img.height <= this.jet_y + this.ship.height))
        },
        attackCheckAndDestroy: function () {
            for (bullet of this.bullets.keys()) {
                if (bullet.y >= this.canva.height || bullet.y <= -this.hero_bullet.height) {
                    this.bullets.delete(bullet);
                }
                else if (bullet.type == "hero") {
                    for (bullet_intersect of this.bullets.keys()) {
                        if (bullet_intersect.type == "enemy" &&
                            bullet.isIntersect(this.hero_bullet, this.enemy_bullet, bullet_intersect.x, bullet_intersect.y)) {
                            this.bullets.delete(bullet);
                            this.bullets.delete(bullet_intersect);
                            this.score += this.score_table.get("bullet");
                        }
                    }
                }
            }
            for (enemy_ship of this.enemy_ships.keys()) {
                if (enemy_ship.isAtWaypoint()) {
                    this.enemy_ships.delete(enemy_ship);
                    continue;
                }
                if (enemy_ship.isIntersect(this.ship, this.enemies.get(enemy_ship.type), this.jet_x, this.jet_y)) {
                    this.drawGameLose();
                }
                for (bullet of this.bullets.keys()) {
                    if (bullet.type == "hero" &&
                        enemy_ship.isIntersect(this.hero_bullet, this.enemies.get(enemy_ship.type), bullet.x, bullet.y)) {
                        this.score += this.score_table.get(enemy_ship.type);
                        this.enemy_ships.delete(enemy_ship);
                        this.bullets.delete(bullet);
                    }
                }
            }
            for (bullet of this.bullets.keys()) {
                if (bullet.type == "enemy" &&
                    this.isIntersect(this.enemy_bullet, bullet.x, bullet.y)) {
                    this.drawGameLose();
                }
            }
        },
        enemyShoot: function () {
            for (enemy_ship of this.enemy_ships.keys()) {
                enemy_ship.shoot();
            }
        },
        moveUpdate: function () {
            if (this.is_running) {
                for (enemy_ship of this.enemy_ships.keys()) {
                    enemy_ship.move();
                }
                for (bullet of this.bullets.keys()) {
                    bullet.move();
                }
                this.move();
            }
        },
        gameCycle: function () {
            this.moveUpdate();
            this.attackCheckAndDestroy();
            this.drawScene();
        },
        startGame: function () {
            if (!this.is_running) {
                this.is_running = true;
                this.resetParams();
                this.game_interval = setInterval(this.gameCycle, 1000 / this.game_fps);
                this.hero_shoot_interval = setInterval(this.shoot, this.shoot_delay);
                this.enemy_spawn_interval = setInterval(this.spawnEnemies, 700);
                this.enemy_shoot_interval = setInterval(this.enemyShoot, 10);

                document.getElementById("start_game").setAttribute("disabled", "true");
                document.getElementById("continue_game").setAttribute("disabled", "true");
                document.getElementById("pause_game").removeAttribute("disabled");
                document.getElementById("pause_game").setAttribute("class", "btn btn-danger");
                document.getElementById("continue_game").setAttribute("class", "btn btn-secondary");
                document.getElementById("start_game").setAttribute("class", "btn btn-success");
                document.getElementById("start_game").innerText = "Start game";
            }
        },
        pauseGame: function () {
            if (this.is_running) {
                this.is_running = false;

                clearInterval(this.game_interval);
                clearInterval(this.hero_shoot_interval);
                clearInterval(this.enemy_spawn_interval);
                clearInterval(this.enemy_shoot_interval);

                document.getElementById("pause_game").setAttribute("disabled", "true");
                document.getElementById("start_game").removeAttribute("disabled");
                document.getElementById("continue_game").removeAttribute("disabled");
                document.getElementById("continue_game").setAttribute("class", "btn btn-warning");
                document.getElementById("start_game").setAttribute("class", "btn btn-danger");
                document.getElementById("start_game").innerText = "Restart";
            }
        },
        unpauseGame: function () {
            if (!this.is_running) {
                this.is_running = true;
                
                this.game_interval = setInterval(this.gameCycle, 1000 / this.game_fps);
                this.hero_shoot_interval = setInterval(this.shoot, this.shoot_delay);
                this.enemy_spawn_interval = setInterval(this.spawnEnemies, 700);
                this.enemy_shoot_interval = setInterval(this.enemyShoot, 10);

                document.getElementById("start_game").setAttribute("disabled", "true");
                document.getElementById("continue_game").setAttribute("disabled", "true");
                document.getElementById("pause_game").removeAttribute("disabled");
                document.getElementById("pause_game").setAttribute("class", "btn btn-danger");
                document.getElementById("continue_game").setAttribute("class", "btn btn-secondary");
                document.getElementById("start_game").setAttribute("class", "btn btn-success");
                document.getElementById("start_game").innerText = "Start game";
            }
        },
        drawGameLose: function () {
            this.is_lost = true;
            this.is_running = false;

            clearInterval(this.game_interval);
            clearInterval(this.hero_shoot_interval);
            clearInterval(this.enemy_spawn_interval);
            clearInterval(this.enemy_shoot_interval);
            
            document.getElementById("start_game").removeAttribute("disabled");
            document.getElementById("pause_game").setAttribute("disabled", "true");
            document.getElementById("pause_game").setAttribute("class", "btn btn-secondary");
            document.getElementById("start_game").innerText = "Restart";
        }
    }
})
