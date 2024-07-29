
import React from "react";
import {DropzoneOptions, useDropzone} from "react-dropzone";
import { LoadingSpinner } from "./loadingSpinner";

interface IDropzoneProps extends DropzoneOptions {
  files                : File[] | {fullPrivacy: boolean, file: File}[];
  title               ?: string,
  description         ?: string;
  displayExtensions   ?: boolean;
  isLoading           ?: boolean;
}

export function Dropzone({ title, description, files, displayExtensions = false, isLoading = false, ...dropzoneOptions }: IDropzoneProps) {
  const {getRootProps, getInputProps} = useDropzone(dropzoneOptions);

  return (
    <div className="w-full text-gray-400">
      { title && <p> {title} </p>}

      <section className="rounded border-2 border-primary-500 border-dashed	cursor-pointer relative">
        { isLoading ? 
          <div className="flex items-center justify-center">
            <LoadingSpinner size={30} />
          </div> : 

          <div {...getRootProps({className: 'dropzone'})}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center font-semibold text-xl p-6 text-center text-primary-600 truncate">
              <span className="text-base text-primary-300">{ description || 'Upload' }</span>
              
              {files?.map((file, i) => <span key={`file-${i}`} className="text-sm text-primary-200">{ file?.name  || file?.file?.name }</span>)}
            </div>
          </div>
        }
      </section>
    </div>
  )
}
