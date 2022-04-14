import type { RecursivePartial } from "./util/recursiveAssign";
import type { ColorTheme } from "./Color";
import { DEFAULT_COLOR_THEME } from "./Color";
import { recursiveAssign } from "./util/recursiveAssign";

interface UserConfig {
    themes: ColorTheme[]
}

const DEFAULT_USER_CONFIG: UserConfig = {
    themes: [DEFAULT_COLOR_THEME]
};

export class User {
    public config: UserConfig;

    constructor (
        public id: string,
        public name: string = "Unknown User",
        config: RecursivePartial<UserConfig> = DEFAULT_USER_CONFIG,
    ) {
        this.config = recursiveAssign(DEFAULT_USER_CONFIG, config);
    }
}
