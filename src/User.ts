import type { RecursivePartial } from "./util/recursiveAssign";
import type { ColorTheme } from "./Color";
import { DEFAULT_COLOR_THEME } from "./Color";
import { recursiveAssign } from "./util/recursiveAssign";

interface DeveloperConfig {
    logging: {
        tick: boolean,
        zenith: boolean,
        rotate: boolean,
    }
}

interface UserConfig {
    themes: {
        list: ColorTheme[],
        active: number,
    }
    developer: DeveloperConfig
}

const DEFAULT_USER_CONFIG: UserConfig = {
    themes: {
        list: [DEFAULT_COLOR_THEME],
        active: 0
    },
    developer: {
        logging: {
            tick: false,
            zenith: false,
            rotate: false,
        }
    }
};

export class User {
    public config: UserConfig;
    public theme: ColorTheme;

    constructor (
        public id: string,
        public name: string = "Unknown User",
        config: RecursivePartial<UserConfig> = DEFAULT_USER_CONFIG,
    ) {
        this.config = recursiveAssign(DEFAULT_USER_CONFIG, config);
        this.theme = this.config.themes.list[this.config.themes.active];
    }

    // #region serde, mut
    public serialize () {
        return {
            id: this.id,
            name: this.name,
            config: this.config,
        };
    }

    public update (data: ReturnType<User["serialize"]>) {
        this.id = data.id,
        this.name = data.name;
        this.config = data.config;
    } 

    public static deserialize (data: ReturnType<User["serialize"]>) {
        return new User(data.id, data.name, data.config);
    }
    // #endregion serde, mut
}
