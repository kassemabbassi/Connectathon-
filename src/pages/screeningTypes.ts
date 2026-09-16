export type PatientForm = {
    fullName: string;
    age: string;
    identity: string;
};

export type ScreeningPhoto = {
    angle: string;
    label: string;
    image: string;
    resultImage?: string;
};

export type SavedScreening = {
    id: string;
    storageKey?: string;
    patient: PatientForm;
    photos: ScreeningPhoto[];
    notes: string;
    result: string;
    flaggedAreas: number;
    savedAt: string;
    validatedAngles?: string[];
};
