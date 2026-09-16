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
