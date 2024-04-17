import React, { useEffect, useRef, useState } from "react";
import {
  ActionButton,
  CrowdfundActionButtonRow,
  CustomInputField,
  ModalBody,
  NewCrowdfundTitle,
} from "./EditIssue-styles.tsx";
import { Box, Modal, Typography, useTheme } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";

import ShortUniqueId from "short-unique-id";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";

import { setNotification } from "../../state/features/notificationsSlice";
import { objectToBase64 } from "../../utils/toBase64";
import { RootState } from "../../state/store";
import {
  setEditFile,
  updateFile,
  updateInHashMap,
} from "../../state/features/fileSlice.ts";
import { QSUPPORT_FILE_BASE } from "../../constants/Identifiers.ts";
import { MultiplePublish } from "../common/MultiplePublish/MultiplePublishAll";
import { TextEditor } from "../common/TextEditor/TextEditor";
import { extractTextFromHTML } from "../common/TextEditor/utils";
import { allCategoryData } from "../../constants/Categories/1stCategories.ts";
import { titleFormatter } from "../../constants/Misc.ts";
import {
  CategoryList,
  CategoryListRef,
  getCategoriesFromObject,
} from "../common/CategoryList/CategoryList.tsx";
import {
  ImagePublisher,
  ImagePublisherRef,
} from "../common/ImagePublisher/ImagePublisher.tsx";
import { ThemeButtonBright } from "../../pages/Home/Home-styles.tsx";

const uid = new ShortUniqueId();
const shortuid = new ShortUniqueId({ length: 5 });

interface NewCrowdfundProps {
  editId?: string;
  editContent?: null | {
    title: string;
    user: string;
    coverImage: string | null;
  };
}

interface VideoFile {
  file: File;
  title: string;
  description: string;
  coverImage?: string;
  identifier?: string;
  filename?: string;
}
export const EditIssue = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const username = useSelector((state: RootState) => state.auth?.user?.name);
  const userAddress = useSelector(
    (state: RootState) => state.auth?.user?.address
  );
  const editFileProperties = useSelector(
    (state: RootState) => state.file.editFileProperties
  );
  const [publishes, setPublishes] = useState<any>(null);
  const [isOpenMultiplePublish, setIsOpenMultiplePublish] = useState(false);
  const [videoPropertiesToSetToRedux, setVideoPropertiesToSetToRedux] =
    useState(null);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const categoryListRef = useRef<CategoryListRef>(null);
  const imagePublisherRef = useRef<ImagePublisherRef>(null);

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 10,
    maxSize: 419430400, // 400 MB in bytes
    onDrop: (acceptedFiles, rejectedFiles) => {
      const formatArray = acceptedFiles.map(item => {
        return {
          file: item,
          title: "",
          description: "",
          coverImage: "",
        };
      });

      setFiles(prev => [...prev, ...formatArray]);

      let errorString = null;
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === "file-too-large") {
            errorString = "File must be under 400mb";
          }
          console.log(`Error with file ${file.name}: ${error.message}`);
        });
      });
      if (errorString) {
        const notificationObj = {
          msg: errorString,
          alertType: "error",
        };

        dispatch(setNotification(notificationObj));
      }
    },
  });

  useEffect(() => {
    if (editFileProperties) {
      setTitle(editFileProperties?.title || "");
      setFiles(editFileProperties?.files || []);
      if (editFileProperties?.htmlDescription) {
        setDescription(editFileProperties?.htmlDescription);
      } else if (editFileProperties?.fullDescription) {
        const paragraph = `<p>${editFileProperties?.fullDescription}</p>`;
        setDescription(paragraph);
      }

      const categoriesFromEditFile =
        getCategoriesFromObject(editFileProperties);
      setEditCategories(categoriesFromEditFile);
    }
  }, [editFileProperties]);
  const onClose = () => {
    dispatch(setEditFile(null));
    setVideoPropertiesToSetToRedux(null);
    setFile(null);
    setTitle("");
    setDescription("");
    setCoverImage("");
  };

  async function publishQDNResource() {
    try {
      const categoryList = categoryListRef.current?.getSelectedCategories();
      if (!description) throw new Error("Please enter a description");
      if (!categoryList[0]) throw new Error("Please select a category");
      if (!editFileProperties) return;
      if (!userAddress) throw new Error("Unable to locate user address");

      let errorMsg = "";
      let name = "";
      if (username) {
        name = username;
      }
      if (!name) {
        errorMsg =
          "Cannot publish without access to your name. Please authenticate.";
      }

      if (editFileProperties?.user !== username) {
        errorMsg = "Cannot publish another user's resource";
      }

      if (errorMsg) {
        dispatch(
          setNotification({
            msg: errorMsg,
            alertType: "error",
          })
        );
        return;
      }

      const sanitizeTitle = title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .toLowerCase();

      if (!sanitizeTitle) throw new Error("Please enter a title");
      let fileReferences = [];

      let listOfPublishes = [];
      const fullDescription = extractTextFromHTML(description);

      for (const publish of files) {
        if (publish?.identifier) {
          fileReferences.push(publish);
          continue;
        }
        const file = publish.file;
        const id = uid();

        const identifier = `${QSUPPORT_FILE_BASE}${sanitizeTitle.slice(0, 30)}_${id}`;

        let fileExtension = "";
        const fileExtensionSplit = file?.name?.split(".");
        if (fileExtensionSplit?.length > 1) {
          fileExtension = fileExtensionSplit?.pop() || "";
        }
        let firstPartName = fileExtensionSplit[0];

        let filename = firstPartName.slice(0, 15);

        // Step 1: Replace all white spaces with underscores

        // Replace all forms of whitespace (including non-standard ones) with underscores
        let stringWithUnderscores = filename.replace(/[\s\uFEFF\xA0]+/g, "_");

        // Remove all non-alphanumeric characters (except underscores)
        let alphanumericString = stringWithUnderscores.replace(
          /[^a-zA-Z0-9_]/g,
          ""
        );

        if (fileExtension) {
          filename = `${alphanumericString.trim()}.${fileExtension}`;
        } else {
          filename = alphanumericString;
        }

        let metadescription =
          `**${categoryListRef.current?.getCategoriesFetchString()}**` +
          fullDescription.slice(0, 150);

        const requestBodyVideo: any = {
          action: "PUBLISH_QDN_RESOURCE",
          name: name,
          service: "FILE",
          file,
          title: title.slice(0, 50),
          description: metadescription,
          identifier,
          filename,
          tag1: QSUPPORT_FILE_BASE,
        };
        listOfPublishes.push(requestBodyVideo);
        fileReferences.push({
          filename: file.name,
          identifier,
          name,
          service: "FILE",
          mimetype: file.type,
          size: file.size,
        });
      }

      const fileObject: any = {
        title,
        version: editFileProperties.version,
        fullDescription,
        htmlDescription: description,
        commentsId: editFileProperties.commentsId,
        ...categoryListRef.current?.categoriesToObject(),
        files: fileReferences,
        images: imagePublisherRef?.current?.getImageArray(),
      };

      let metadescription =
        `**${categoryListRef.current?.getCategoriesFetchString()}**` +
        fullDescription.slice(0, 150);

      const fileObjectToBase64 = await objectToBase64(fileObject);
      // Description is obtained from raw data

      const requestBodyJson: any = {
        action: "PUBLISH_QDN_RESOURCE",
        name: name,
        service: "DOCUMENT",
        data64: fileObjectToBase64,
        title: title.slice(0, 50),
        description: metadescription,
        identifier: editFileProperties.id,
        tag1: QSUPPORT_FILE_BASE,
        filename: `video_metadata.json`,
      };
      listOfPublishes.push(requestBodyJson);

      const multiplePublish = {
        action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
        resources: [...listOfPublishes],
      };
      setPublishes(multiplePublish);
      setIsOpenMultiplePublish(true);
      setVideoPropertiesToSetToRedux({
        ...editFileProperties,
        ...fileObject,
      });
    } catch (error: any) {
      let notificationObj: any = null;
      if (typeof error === "string") {
        notificationObj = {
          msg: error || "Failed to publish update",
          alertType: "error",
        };
      } else if (typeof error?.error === "string") {
        notificationObj = {
          msg: error?.error || "Failed to publish update",
          alertType: "error",
        };
      } else {
        notificationObj = {
          msg: error?.message || "Failed to publish update",
          alertType: "error",
        };
      }
      if (!notificationObj) return;
      dispatch(setNotification(notificationObj));

      throw new Error("Failed to publish update");
    }
  }

  const handleOnchange = (index: number, type: string, value: string) => {
    // setFiles((prev) => {
    //   let formattedValue = value
    //   console.log({type})
    //   if(type === 'title'){
    //     formattedValue = value.replace(/[^a-zA-Z0-9\s]/g, "")
    //   }
    //   const copyFiles = [...prev];
    //   copyFiles[index] = {
    //     ...copyFiles[index],
    //     [type]: formattedValue,
    //   };
    //   return copyFiles;
    // });
  };

  return (
    <>
      <Modal
        open={!!editFileProperties}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <ModalBody>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <NewCrowdfundTitle>Update Issue</NewCrowdfundTitle>
          </Box>
          <>
            <Box
              {...getRootProps()}
              sx={{
                border: "1px dashed gray",
                padding: 2,
                textAlign: "center",
                marginBottom: 2,
                cursor: "pointer",
              }}
            >
              <input {...getInputProps()} />
              <Typography>Click to add more files</Typography>
            </Box>
            {files.map((file, index) => {
              const isExistingFile = !!file?.identifier;
              return (
                <React.Fragment key={index}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography>
                      {isExistingFile ? file.filename : file?.file?.name}
                    </Typography>
                    <RemoveIcon
                      onClick={() => {
                        setFiles(prev => {
                          const copyPrev = [...prev];
                          copyPrev.splice(index, 1);
                          return copyPrev;
                        });
                      }}
                      sx={{
                        cursor: "pointer",
                      }}
                    />
                  </Box>
                </React.Fragment>
              );
            })}

            <Box
              sx={{
                display: "flex",
                gap: "20px",
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  width: "100%",
                }}
              >
                <CategoryList
                  categoryData={allCategoryData}
                  initialCategories={editCategories}
                  columns={3}
                  ref={categoryListRef}
                />
              </Box>
            </Box>
            <ImagePublisher
              ref={imagePublisherRef}
              initialImages={editFileProperties?.images}
            />
            <CustomInputField
              name="title"
              label="Title of Issue"
              variant="filled"
              value={title}
              onChange={e => {
                const value = e.target.value;
                const formattedValue = value.replace(titleFormatter, "");
                setTitle(formattedValue);
              }}
              inputProps={{ maxLength: 180 }}
              required
            />
            <Typography
              sx={{
                fontSize: "18px",
              }}
            >
              Description of Issue
            </Typography>
            <TextEditor
              inlineContent={description}
              setInlineContent={value => {
                setDescription(value);
              }}
            />
          </>

          <CrowdfundActionButtonRow>
            <ActionButton
              onClick={() => {
                onClose();
              }}
              variant="contained"
              color="error"
              sx={{ color: theme.palette.text.primary }}
            >
              Cancel
            </ActionButton>
            <Box
              sx={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
              }}
            >
              <ThemeButtonBright
                variant="contained"
                onClick={() => {
                  publishQDNResource();
                }}
                sx={{
                  fontFamily: "Montserrat",
                  fontSize: "16px",
                  fontWeight: 400,
                  letterSpacing: "0.2px",
                }}
              >
                Publish
              </ThemeButtonBright>
            </Box>
          </CrowdfundActionButtonRow>
        </ModalBody>
      </Modal>
      {isOpenMultiplePublish && (
        <MultiplePublish
          isOpen={isOpenMultiplePublish}
          onError={messageNotification => {
            setIsOpenMultiplePublish(false);
            setPublishes(null);
            if (messageNotification) {
              dispatch(
                setNotification({
                  msg: messageNotification,
                  alertType: "error",
                })
              );
            }
          }}
          onSubmit={() => {
            setIsOpenMultiplePublish(false);
            const clonedCopy = structuredClone(videoPropertiesToSetToRedux);
            dispatch(updateFile(clonedCopy));
            dispatch(updateInHashMap(clonedCopy));
            dispatch(
              setNotification({
                msg: "File updated",
                alertType: "success",
              })
            );
            onClose();
          }}
          publishes={publishes}
        />
      )}
    </>
  );
};
