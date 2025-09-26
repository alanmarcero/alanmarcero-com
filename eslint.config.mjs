var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
export default defineConfig(__spreadArray([
    {
        ignores: [
            "jest.config.js",
            "node_modules"
        ],
    },
    {
        files: ["**/*.{js,ts}"],
        plugins: { js: js },
        extends: ["js/recommended"],
        languageOptions: {
            globals: globals.node
        },
    }
], tseslint.configs.recommended, true));
