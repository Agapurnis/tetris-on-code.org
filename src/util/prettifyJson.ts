export function prettyifyJson (json: string) {
    let output = "";
    const split = json.split("");

    for (const character of split) {
        let lf = false;

        if (character === '{') lf = true;
        else if (character === '}') lf = true;
        else if (character === '[') lf = true;
        else if (character === ']') lf = true;
        else if (character === ',') lf = true;

        if (lf) output += "\n";
        output += character;
    }

    return output;
}
