import express from 'express';
import { getFaculties, getGroups, getGroupSchedule, getTeacherSchedule, searchTeachers } from './client.js';

const app = express();
const port = 3000;

app.use(express.static('frontend'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use('/jquery', express.static('node_modules/jquery/dist'));
app.use('/axios', express.static('node_modules/axios/dist'));

app.use(express.json());

app.get('/api/rasp/faculties', async (req, res) => {
    try {
        const faculties = await getFaculties();
    res.send(faculties);
    } catch (err) {
        res.status(500).json({error: "Произошла ошибка"});
    }
});

app.get('/api/rasp/groups', async (req, res) => {
    try {
        const facultyId = req.query.facultyId;
    const course = req.query.course;

    const data = await getGroups(facultyId, course);
    res.send(data);
    } catch (err) {
        res.status(500).json({error: "Произошла ошибка"});
    }
});

app.get('/api/rasp', async (req, res) => {
    try {
        const groupId = req.query.groupId;
        const staffId = req.query.staffId;
        const weekNumber = req.query.selectedWeek;

        let data;
        if (groupId !== undefined && groupId !== null && groupId !== 'null') {
            data = await getGroupSchedule(groupId, weekNumber);
        } else if (staffId !== undefined && staffId != null && staffId !== 'null') {
            data = await getTeacherSchedule(staffId, weekNumber);
        } else {
            return res.status(400).json({error: 'BAD REQUEST'});
        }

        res.send(data);
    } catch (err) {
        res.status(500).json({error: "Произошла ошибка"});
    }
});

app.post('/api/staff', async (req, res) => {
    try {
        const staff = await searchTeachers(req.body.name);
    res.json(staff);
    } catch (err) {
        res.status(500).json({error: "Произошла ошибка"});
    }
});

app.listen(port, () => {
    console.log(`Server listening port ${port}`);
});