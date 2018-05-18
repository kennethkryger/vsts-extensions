import { AppObservableService } from "Common/Utilities/Context";

export abstract class BaseDataService<TCollection, TItem, TKey> extends AppObservableService<void> {
    protected items: TCollection;

    private _isLoading: boolean;
    private _isItemLoadingMap: IDictionaryStringTo<boolean>;

    constructor() {
        super();
        this.items = null;
        this._isLoading = false;
        this._isItemLoadingMap = {};
    }

    public isLoaded(key?: TKey): boolean {
        let dataLoaded: boolean;
        if (key) {
            dataLoaded = this.itemExists(key);
        }
        else {
            dataLoaded = this.items != null ? true : false;
        }

        return dataLoaded && !this.isLoading(key);
    }

    public isLoading(key?: TKey): boolean {
        if (key) {
            return this._isLoading || this._isItemLoadingMap[this.convertItemKeyToString(key).toLowerCase()] === true;
        }
        else {
            return this._isLoading;
        }
    }

    public setLoading(loading: boolean, key?: TKey) {
        if (key) {
            const stringKey = this.convertItemKeyToString(key).toLowerCase();
            if (loading) {
                this._isItemLoadingMap[stringKey] = true;
            }
            else {
                delete this._isItemLoadingMap[stringKey];
            }
        }
        else {
            this._isLoading = loading;
        }

        this._notifyChanged();
    }

    public itemExists(key: TKey): boolean {
        return this.getItem(key) != null ? true : false;
    }

    public getAll(): TCollection {
        return this.items;
    }

    public abstract getItem(key: TKey): TItem;
    public abstract getKey(): string;

    protected _notifyChanged() {
        this.notify(null, "dataChanged");
    }

    protected abstract convertItemKeyToString(key: TKey): string;
}
