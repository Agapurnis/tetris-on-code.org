import type { RecursivePartial } from "./util/recursiveAssign";
import type { ColorTheme } from "./Color";
import { DEFAULT_COLOR_THEME } from "./Color";
import { recursiveAssign } from "./util/recursiveAssign";

interface DeveloperConfig {
    draw: boolean,
    logging: {
        tick: boolean,
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
        draw: false,
        logging: {
            tick: false,
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

    // #region serde
    public serialize () {
        return {
            id: this.id,
            name: this.name,
            config: this.config,
        };
    }

    public static deserialize (data: ReturnType<User["serialize"]>) {
        return new User(data.id, data.name, data.config);
    }
    // #endregion serde
}
