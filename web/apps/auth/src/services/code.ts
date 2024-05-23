import { URI } from "vscode-uri";

type Type = "totp" | "TOTP" | "hotp" | "HOTP";

type AlgorithmType =
    | "sha1"
    | "SHA1"
    | "sha256"
    | "SHA256"
    | "sha512"
    | "SHA512";

export class Code {
    static readonly defaultAlgo = "sha1";

    // id for the corresponding auth entity
    id?: String;
    account: string;
    issuer: string;
    digits: number;
    period: number;
    secret: string;
    algorithm: AlgorithmType;
    type: Type;
    rawData?: string;

    constructor(
        account: string,
        issuer: string,
        digits: number | undefined,
        period: number,
        secret: string,
        algorithm: AlgorithmType,
        type: Type,
        rawData?: string,
        id?: string,
    ) {
        this.account = account;
        this.issuer = issuer;
        this.digits = digits;
        this.period = period;
        this.secret = secret;
        this.algorithm = algorithm;
        this.type = type;
        this.rawData = rawData;
        this.id = id;
    }
}

export const codeFromRawData = (id: string, rawData: string): Code => {
    let santizedRawData = rawData
        .replace(/\+/g, "%2B")
        .replace(/:/g, "%3A")
        .replaceAll("\r", "");
    if (santizedRawData.startsWith('"')) {
        santizedRawData = santizedRawData.substring(1);
    }
    if (santizedRawData.endsWith('"')) {
        santizedRawData = santizedRawData.substring(
            0,
            santizedRawData.length - 1,
        );
    }

    const uriParams = {};
    const searchParamsString =
        decodeURIComponent(santizedRawData).split("?")[1];
    searchParamsString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        uriParams[key] = value;
    });

    const uri = URI.parse(santizedRawData);
    let uriPath = decodeURIComponent(uri.path);
    if (uriPath.startsWith("/otpauth://") || uriPath.startsWith("otpauth://")) {
        uriPath = uriPath.split("otpauth://")[1];
    } else if (uriPath.startsWith("otpauth%3A//")) {
        uriPath = uriPath.split("otpauth%3A//")[1];
    }

    return new Code(
        _getAccount(uriPath),
        _getIssuer(uriPath, uriParams),
        _getDigits(uriParams) || 6,
        _getPeriod(uriParams) || 30,
        getSanitizedSecret(uriParams),
        _getAlgorithm(uriParams),
        _getType(uriPath),
        rawData,
        id,
    );
};

const _getAccount = (uriPath: string): string => {
    try {
        const path = decodeURIComponent(uriPath);
        if (path.includes(":")) {
            return path.split(":")[1];
        } else if (path.includes("/")) {
            return path.split("/")[1];
        }
    } catch (e) {
        return "";
    }
};

const _getIssuer = (uriPath: string, uriParams: { get?: any }): string => {
    try {
        if (uriParams["issuer"] !== undefined) {
            let issuer = uriParams["issuer"];
            // This is to handle bug in the ente auth app
            if (issuer.endsWith("period")) {
                issuer = issuer.substring(0, issuer.length - 6);
            }
            return issuer;
        }
        let path = decodeURIComponent(uriPath);
        if (path.startsWith("totp/") || path.startsWith("hotp/")) {
            path = path.substring(5);
        }
        if (path.includes(":")) {
            return path.split(":")[0];
        } else if (path.includes("-")) {
            return path.split("-")[0];
        }
        return path;
    } catch (e) {
        return "";
    }
};

const _getDigits = (uriParams): number | undefined => {
    try {
        return parseInt(uriParams["digits"], 10);
    } catch (e) {
        return undefined;
    }
};

const _getPeriod = (uriParams): number | undefined => {
    try {
        return parseInt(uriParams["period"], 10);
    } catch (e) {
        return undefined;
    }
};

const _getAlgorithm = (uriParams): AlgorithmType => {
    try {
        const algorithm = uriParams["algorithm"].toLowerCase();
        if (algorithm === "sha256") {
            return algorithm;
        } else if (algorithm === "sha512") {
            return algorithm;
        }
    } catch (e) {
        // nothing
    }
    return "sha1";
};

const _getType = (uriPath: string): Type => {
    const oauthType = uriPath.split("/")[0].substring(0);
    if (oauthType.toLowerCase() === "totp") {
        return "totp";
    } else if (oauthType.toLowerCase() === "hotp") {
        return "hotp";
    }
    throw new Error(`Unsupported format with host ${oauthType}`);
};

const getSanitizedSecret = (uriParams): string => {
    return uriParams["secret"].replace(/ /g, "").toUpperCase();
};
