import { FlexWrapper } from "@ente/shared/components/Container";
import DialogTitleWithCloseButton from "@ente/shared/components/DialogBox/TitleWithCloseButton";
import { DialogContent } from "@mui/material";
import { AllCollectionDialog } from "components/Collections/AllCollections/dialog";
import {
    COLLECTION_SORT_ORDER,
    CollectionSummaryType,
    DUMMY_UNCATEGORIZED_COLLECTION,
} from "constants/collection";
import { t } from "i18next";
import { AppContext } from "pages/_app";
import { useContext, useEffect, useState } from "react";
import { createUnCategorizedCollection } from "services/collectionService";
import {
    Collection,
    CollectionSummaries,
    CollectionSummary,
} from "types/collection";
import { CollectionSelectorIntent } from "types/gallery";
import {
    isAddToAllowedCollection,
    isMoveToAllowedCollection,
} from "utils/collection";
import AddCollectionButton from "./AddCollectionButton";
import CollectionSelectorCard from "./CollectionCard";

export interface CollectionSelectorAttributes {
    callback: (collection: Collection) => void;
    showNextModal: () => void;
    intent: CollectionSelectorIntent;
    fromCollection?: number;
    onCancel?: () => void;
}

interface Props {
    open: boolean;
    onClose: () => void;
    attributes: CollectionSelectorAttributes;
    collections: Collection[];
    collectionSummaries: CollectionSummaries;
}

function CollectionSelector({
    attributes,
    collectionSummaries,
    collections,
    ...props
}: Props) {
    const appContext = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [collectionsToShow, setCollectionsToShow] = useState<
        CollectionSummary[]
    >([]);
    useEffect(() => {
        if (!attributes || !props.open) {
            return;
        }
        const main = async () => {
            const collectionsToShow = [...collectionSummaries.values()]
                ?.filter(({ id, type }) => {
                    if (id === attributes.fromCollection) {
                        return false;
                    } else if (
                        attributes.intent === CollectionSelectorIntent.add
                    ) {
                        return isAddToAllowedCollection(type);
                    } else if (
                        attributes.intent === CollectionSelectorIntent.upload
                    ) {
                        return (
                            isMoveToAllowedCollection(type) ||
                            type === CollectionSummaryType.uncategorized
                        );
                    } else if (
                        attributes.intent === CollectionSelectorIntent.restore
                    ) {
                        return (
                            isMoveToAllowedCollection(type) ||
                            type === CollectionSummaryType.uncategorized
                        );
                    } else {
                        return isMoveToAllowedCollection(type);
                    }
                })

                .sort((a, b) => {
                    return a.name.localeCompare(b.name);
                })
                .sort((a, b) => {
                    return (
                        COLLECTION_SORT_ORDER.get(a.type) -
                        COLLECTION_SORT_ORDER.get(b.type)
                    );
                })
                .filter((collection) =>
                    collection.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                );
            if (collectionsToShow.length === 0) {
                if (searchQuery !== "") {
                    return console.log("No Albums with that name...");
                } else {
                    props.onClose();
                    attributes.showNextModal();
                }
            }
            setCollectionsToShow(collectionsToShow);
        };
        main();
    }, [collectionSummaries, attributes, props.open, searchQuery]);

    if (!collectionsToShow?.length) {
        return <></>;
    }

    const handleCollectionClick = async (collectionID: number) => {
        let selectedCollection: Collection;
        if (collectionID === DUMMY_UNCATEGORIZED_COLLECTION) {
            const uncategorizedCollection =
                await createUnCategorizedCollection();
            selectedCollection = uncategorizedCollection;
        } else {
            selectedCollection = collections.find((c) => c.id === collectionID);
        }
        attributes.callback(selectedCollection);
        props.onClose();
    };

    const onUserTriggeredClose = () => {
        attributes.onCancel?.();
        props.onClose();
    };

    const handleSearchInputChange = (e) => {
        if (e) {
            setSearchQuery(e.target.value);
        } else console.log("No collections to show.....");
    };

    return (
        <AllCollectionDialog
            onClose={onUserTriggeredClose}
            open={props.open}
            position="center"
            fullScreen={appContext.isMobile}
        >
            <DialogTitleWithCloseButton onClose={onUserTriggeredClose}>
                {attributes.intent === CollectionSelectorIntent.upload
                    ? t("UPLOAD_TO_COLLECTION")
                    : attributes.intent === CollectionSelectorIntent.add
                      ? t("ADD_TO_COLLECTION")
                      : attributes.intent === CollectionSelectorIntent.move
                        ? t("MOVE_TO_COLLECTION")
                        : attributes.intent === CollectionSelectorIntent.restore
                          ? t("RESTORE_TO_COLLECTION")
                          : attributes.intent ===
                              CollectionSelectorIntent.unhide
                            ? t("UNHIDE_TO_COLLECTION")
                            : t("SELECT_COLLECTION")}
            </DialogTitleWithCloseButton>
            <input
                style={{
                    height: "50px",
                    fontSize: "16px",
                    borderRadius: "10px",
                    margin: "10px",
                }}
                placeholder="Search Albums..."
                value={searchQuery}
                onChange={handleSearchInputChange}
            />
            <DialogContent sx={{ "&&&": { padding: 0 } }}>
                <FlexWrapper flexWrap="wrap" gap={"4px"} padding={"16px"}>
                    <AddCollectionButton
                        showNextModal={attributes.showNextModal}
                    />
                    {collectionsToShow.map((collectionSummary) => (
                        <CollectionSelectorCard
                            onCollectionClick={handleCollectionClick}
                            collectionSummary={collectionSummary}
                            key={collectionSummary.id}
                        />
                    ))}
                </FlexWrapper>
            </DialogContent>
        </AllCollectionDialog>
    );
}

export default CollectionSelector;
